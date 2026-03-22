import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import {
  ContactType,
  InquiryAuditAction,
  InquiryPriority,
  InquiryStatus,
  InquiryType,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const INBOX_BY_TYPE: Record<ContactType, string> = {
  SUPPORT: 'support@bookstore.local',
  AUTHOR: 'authors@bookstore.local',
  PUBLISHER: 'publishers@bookstore.local',
  BUSINESS: 'business@bookstore.local',
  LEGAL: 'legal@bookstore.local',
};

const AUTO_REPLY_BY_TYPE: Record<ContactType, string> = {
  SUPPORT:
    'Thanks for reaching out. Our support team will get back to you within 24–48 hours.',
  AUTHOR:
    'Thanks for getting in touch. We usually respond within 2–3 business days.',
  PUBLISHER:
    'Thanks for contacting us. Our publishing team will respond shortly.',
  BUSINESS: 'Thanks for reaching out. Our business team will follow up soon.',
  LEGAL: 'Thanks for your message. Our legal/technical team will respond soon.',
};

const DEPARTMENT_CODE_BY_CONTACT_TYPE: Record<ContactType, string> = {
  SUPPORT: 'CS',
  AUTHOR: 'CS',
  PUBLISHER: 'CS',
  BUSINESS: 'FIN',
  LEGAL: 'FIN',
};

const DEPARTMENT_FALLBACKS_BY_CONTACT_TYPE: Record<ContactType, string[]> = {
  SUPPORT: ['CS', 'SUPPORT', 'CUSTOMER_SERVICE', 'CUSTOMER SUPPORT'],
  AUTHOR: ['CS', 'SUPPORT', 'CUSTOMER_SERVICE', 'CUSTOMER SUPPORT'],
  PUBLISHER: ['CS', 'SUPPORT', 'CUSTOMER_SERVICE', 'CUSTOMER SUPPORT'],
  BUSINESS: ['FIN', 'FINANCE', 'ACCOUNTING'],
  LEGAL: ['FIN', 'FINANCE', 'LEGAL'],
};

const INQUIRY_TYPE_BY_CONTACT_TYPE: Record<ContactType, InquiryType> = {
  SUPPORT: InquiryType.OTHER,
  AUTHOR: InquiryType.AUTHOR,
  PUBLISHER: InquiryType.AUTHOR,
  BUSINESS: InquiryType.PAYMENT,
  LEGAL: InquiryType.LEGAL,
};

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async resolveInquiryCreatorId(email: string) {
    const normalizedEmail = email.trim();
    const linkedUser = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (linkedUser) {
      return { id: linkedUser.id, isLinkedUser: true };
    }

    const fallbackUser = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (fallbackUser) {
      return { id: fallbackUser.id, isLinkedUser: false };
    }

    const anyActiveUser = await this.prisma.user.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!anyActiveUser) {
      return null;
    }

    return { id: anyActiveUser.id, isLinkedUser: false };
  }

  private async resolveTargetDepartmentId(type: ContactType) {
    const preferredCode = DEPARTMENT_CODE_BY_CONTACT_TYPE[type];
    const preferred = await this.prisma.department.findFirst({
      where: {
        code: preferredCode,
        isActive: true,
      },
      select: { id: true },
    });

    if (preferred) {
      return preferred.id;
    }

    const tokens = DEPARTMENT_FALLBACKS_BY_CONTACT_TYPE[type];
    const alternatives = await this.prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
    });

    const normalizedTokens = tokens.map((token) => token.toLowerCase());
    const byFallback = alternatives.find((department) => {
      const code = department.code.toLowerCase();
      const name = department.name.toLowerCase();
      return normalizedTokens.some(
        (token) =>
          code === token || code.includes(token) || name.includes(token),
      );
    });

    if (byFallback) {
      return byFallback.id;
    }

    const supportQueuePermissions = [
      'support.inquiries.view',
      'support.inquiries.reply',
      'support.inquiries.assign',
      'support.inquiries.escalate',
      'support.messages.view',
      'support.messages.reply',
      'support.messages.resolve',
      'department.inquiries.view',
      'department.inquiries.reply',
    ];

    const financeQueuePermissions = [
      'finance.inquiries.view',
      'finance.inquiries.reply',
      'finance.inquiries.manage',
      'legal.inquiries.view',
      'legal.inquiries.manage',
      'business.inquiries.view',
      'business.inquiries.manage',
    ];

    const queuePermissionKeys =
      type === ContactType.SUPPORT ||
      type === ContactType.AUTHOR ||
      type === ContactType.PUBLISHER
        ? supportQueuePermissions
        : financeQueuePermissions;

    const staffWithQueuePermission = await this.prisma.staffProfile.findFirst({
      where: {
        status: 'ACTIVE',
        assignments: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: {
                    key: { in: queuePermissionKeys },
                  },
                },
              },
            },
          },
        },
      },
      select: { departmentId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (staffWithQueuePermission?.departmentId) {
      return staffWithQueuePermission.departmentId;
    }

    const anyActiveStaffDepartment = await this.prisma.staffProfile.findFirst({
      where: {
        status: 'ACTIVE',
        department: { isActive: true },
      },
      select: { departmentId: true },
      orderBy: { createdAt: 'asc' },
    });

    return anyActiveStaffDepartment?.departmentId;
  }

  private buildInquiryMessageFromContact(dto: CreateContactDto) {
    const metadata = dto.metadata ?? {};
    const lines: string[] = [`Contact sender: ${dto.name} <${dto.email}>`];

    if (dto.subject) {
      lines.push(`Topic: ${dto.subject}`);
    }

    const stockFields = [
      ['Book title', metadata.bookTitle],
      ['Author', metadata.author],
      ['ISBN', metadata.isbn],
      ['Language', metadata.language],
      ['Request reason', metadata.requestReason],
      ['Preferred format', metadata.format],
    ] as const;

    const hasAnyStockField = stockFields.some(([, value]) =>
      typeof value === 'string' ? value.trim().length > 0 : Boolean(value),
    );

    if (hasAnyStockField) {
      lines.push('Stock request details:');
      for (const [label, rawValue] of stockFields) {
        if (typeof rawValue !== 'string') continue;
        const value = rawValue.trim();
        if (!value) continue;
        lines.push(`${label}: ${value}`);
      }
    }

    lines.push('', dto.message);
    return lines.join('\n');
  }

  private inferInquiryType(dto: CreateContactDto): InquiryType {
    if (dto.type !== ContactType.SUPPORT) {
      return INQUIRY_TYPE_BY_CONTACT_TYPE[dto.type];
    }

    const metadata = dto.metadata ?? {};
    const hasStockMetadata = [
      metadata.bookTitle,
      metadata.author,
      metadata.isbn,
      metadata.language,
      metadata.requestReason,
      metadata.format,
    ].some((value) => typeof value === 'string' && value.trim().length > 0);

    const normalizedSubject = dto.subject?.trim().toLowerCase() ?? '';
    const normalizedMessage = dto.message.trim().toLowerCase();
    const looksLikeStockRequest =
      normalizedSubject.includes('book availability') ||
      normalizedSubject.includes('stock inquiry') ||
      normalizedMessage.includes('book availability request');

    if (hasStockMetadata || looksLikeStockRequest) {
      return InquiryType.STOCK;
    }

    return INQUIRY_TYPE_BY_CONTACT_TYPE[dto.type];
  }

  async createMessage(dto: CreateContactDto) {
    const message = await this.prisma.contactMessage.create({
      data: {
        type: dto.type,
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
        metadata: dto.metadata,
        status: 'NEW',
      },
    });

    const inbox = INBOX_BY_TYPE[dto.type];
    const subject = dto.subject || `New ${dto.type} inquiry`;

    await this.prisma.contactNotification.createMany({
      data: [
        {
          type: dto.type,
          recipient: inbox,
          subject,
          body: dto.message,
          messageId: message.id,
        },
        {
          type: dto.type,
          recipient: dto.email,
          subject: `We received your message`,
          body: AUTO_REPLY_BY_TYPE[dto.type],
          messageId: message.id,
        },
      ],
    });

    const inquiryCreator = await this.resolveInquiryCreatorId(dto.email);

    const targetDepartmentId = await this.resolveTargetDepartmentId(dto.type);
    let createdInquiryId: string | null = null;

    if (targetDepartmentId && inquiryCreator) {
      await this.prisma.$transaction(async (tx) => {
        const inquiry = await tx.inquiry.create({
          data: {
            type: this.inferInquiryType(dto),
            departmentId: targetDepartmentId,
            status: InquiryStatus.OPEN,
            priority: InquiryPriority.MEDIUM,
            createdByUserId: inquiryCreator.id,
            subject: dto.subject || `Contact inquiry (${dto.type})`,
          },
        });

        await tx.inquiryMessage.create({
          data: {
            inquiryId: inquiry.id,
            senderId: inquiryCreator.id,
            senderType: 'USER',
            message: this.buildInquiryMessageFromContact(dto),
          },
        });

        await tx.inquiryAudit.create({
          data: {
            inquiryId: inquiry.id,
            action: InquiryAuditAction.CREATED,
            toDepartmentId: targetDepartmentId,
            performedByUserId: inquiryCreator.id,
          },
        });

        await this.notificationsService.createInquiryNotificationForDepartment(
          tx,
          {
            departmentId: targetDepartmentId,
            type: 'INQUIRY_CREATED',
            relatedEntityId: inquiry.id,
            title: 'New inquiry from contact form',
            message: dto.subject || 'Contact inquiry submitted',
            link: `/admin/inquiries/${inquiry.id}`,
          },
        );
        createdInquiryId = inquiry.id;
      });
    }

    if (inquiryCreator?.isLinkedUser && createdInquiryId) {
      await this.notificationsService.createUserNotification({
        userId: inquiryCreator.id,
        type: 'INQUIRY_UPDATE',
        title: 'Inquiry received',
        message:
          'We received your inquiry and routed it to our staff. You will get an update soon.',
        link: '/contact',
      });
    }

    return {
      ...message,
      createdInquiryId,
      routedToDepartmentId: targetDepartmentId ?? null,
      routingSucceeded: Boolean(createdInquiryId),
    };
  }

  async listNotifications(limit = 10) {
    return this.prisma.contactNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
