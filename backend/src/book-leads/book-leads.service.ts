import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookLeadStatus,
  InquirySenderType,
  InquiryStatus,
  InquiryType,
  Prisma,
} from '@prisma/client';
import { assertUserPermission } from '../auth/permission-resolution';
import { PrismaService } from '../database/prisma.service';
import { CreateBookLeadDto } from './dto/create-book-lead.dto';
import {
  BookLeadView,
  BookLeadWorkflowStage,
  ListBookLeadsDto,
} from './dto/list-book-leads.dto';
import { UpdateBookLeadDto } from './dto/update-book-lead.dto';
import { ConvertBookLeadDto } from './dto/convert-book-lead.dto';

@Injectable()
export class BookLeadsService {
  constructor(private readonly prisma: PrismaService) {}

  private clamp(value: number | undefined, fallback: number, max: number) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.max(1, Math.min(max, Math.floor(value as number)));
  }

  private normalizeText(value: string) {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private compactWhitespace(value: string | null | undefined) {
    return (value ?? '').replace(/\s+/g, ' ').trim();
  }

  private clipText(value: string, max = 180) {
    if (value.length <= max) {
      return value;
    }
    return `${value.slice(0, max - 3)}...`;
  }

  private isGenericInquirySubject(subject: string) {
    const normalized = this.normalizeText(subject);
    if (!normalized) {
      return true;
    }
    if (/^\[faker\]\s*inquiry\s*#\d+$/i.test(normalized)) {
      return true;
    }
    if (/^inquiry\s*#\d+$/i.test(normalized)) {
      return true;
    }
    if (
      normalized === 'missing item in package' ||
      normalized === 'stock inquiry'
    ) {
      return true;
    }
    return false;
  }

  private isLikelyStockInquiry(subject: string, message: string) {
    const normalizedSubject = this.normalizeText(subject);
    const normalizedMessage = this.normalizeText(message);

    if (!normalizedSubject && !normalizedMessage) {
      return false;
    }

    if (
      normalizedSubject.includes('book availability') ||
      normalizedSubject.includes('stock inquiry')
    ) {
      return true;
    }

    return (
      normalizedMessage.includes('stock request details:') ||
      normalizedMessage.includes('book availability request') ||
      normalizedMessage.includes('book title:') ||
      normalizedMessage.includes('author:')
    );
  }

  private isPlaceholderLeadTitle(title: string) {
    const normalized = this.compactWhitespace(title);
    if (!normalized) {
      return true;
    }

    if (/^\[faker\]\s*inquiry\s*#\d+$/i.test(normalized)) {
      return true;
    }

    if (/^stock inquiry [a-z0-9]{4,}$/i.test(normalized)) {
      return true;
    }

    if (/^customer message:/i.test(normalized)) {
      return true;
    }

    return this.isGenericInquirySubject(normalized);
  }

  private buildInquiryLink(inquiryId: string) {
    return `Linked inquiry: ${inquiryId}`;
  }

  private extractDemandMatches(note: string | null | undefined) {
    if (!note) return [];
    return [
      ...(note.match(/Linked stock inquiry:\s*[a-z0-9-]+/gi) ?? []),
      ...(note.match(/Linked inquiry:\s*[a-z0-9-]+/gi) ?? []),
    ];
  }

  private extractLabeledValue(text: string, labels: string[]) {
    for (const label of labels) {
      const regex = new RegExp(
        `(?:^|\\n|\\r|\\b)\\s*${label}\\s*[:\\-]\\s*(.+)`,
        'i',
      );
      const match = text.match(regex);
      if (!match?.[1]) {
        continue;
      }
      const firstLine = match[1].split(/\r?\n/)[0] ?? '';
      const cleaned = this.compactWhitespace(
        firstLine.replace(/^["'`]+|["'`]+$/g, ''),
      );
      if (cleaned) {
        return cleaned;
      }
    }
    return '';
  }

  private parseInquirySubject(subject: string) {
    const cleaned = subject.trim();
    if (!cleaned || this.isGenericInquirySubject(cleaned)) {
      return {
        title: '',
        author: 'Unknown',
      };
    }

    const byIndex = cleaned.toLowerCase().indexOf(' by ');
    if (byIndex > 0) {
      return {
        title: cleaned.slice(0, byIndex).trim(),
        author: cleaned.slice(byIndex + 4).trim() || 'Unknown',
      };
    }

    return {
      title: cleaned,
      author: 'Unknown',
    };
  }

  private parseInquiryLeadData(
    subject: string,
    message: string,
    inquiryId: string,
  ) {
    const rawMessage = message ?? '';
    const cleanedMessage = this.compactWhitespace(rawMessage);
    const cleanedSubject = this.compactWhitespace(subject);
    const labeledTitle = this.extractLabeledValue(rawMessage, [
      'book title',
      'title',
      'book',
    ]);
    const labeledAuthor = this.extractLabeledValue(rawMessage, [
      'author',
      'writer',
      'by',
    ]);

    let title = labeledTitle;
    let author = labeledAuthor || 'Unknown';

    if (!title && cleanedMessage) {
      const quotedByMatch = cleanedMessage.match(
        /["“]([^"”]{2,160})["”]\s+by\s+([a-z0-9 .,'&-]{2,100})/i,
      );
      if (quotedByMatch) {
        title = this.compactWhitespace(quotedByMatch[1]);
        author = this.compactWhitespace(quotedByMatch[2]) || author;
      }
    }

    if (!title && cleanedMessage) {
      const plainByMatch = cleanedMessage.match(
        /\b([a-z0-9][a-z0-9 :,.'&\-()]{2,160})\s+by\s+([a-z0-9 .,'&-]{2,100})\b/i,
      );
      if (plainByMatch) {
        title = this.compactWhitespace(plainByMatch[1]);
        author = this.compactWhitespace(plainByMatch[2]) || author;
      }
    }

    if (
      !title &&
      cleanedSubject &&
      !this.isGenericInquirySubject(cleanedSubject)
    ) {
      const subjectParsed = this.parseInquirySubject(cleanedSubject);
      title = title || subjectParsed.title;
      if (author === 'Unknown' && subjectParsed.author !== 'Unknown') {
        author = subjectParsed.author;
      }
    }

    if (!title && cleanedMessage) {
      const firstSentence = cleanedMessage.split(/[.!?\n]/)[0] ?? '';
      title = this.compactWhitespace(firstSentence);
    }

    if (!title) {
      title = `Stock inquiry ${inquiryId.slice(0, 8)}`;
    }

    return {
      title: this.clipText(title, 180),
      author: author || 'Unknown',
      messagePreview: this.clipText(cleanedMessage, 220),
      subjectPreview: this.clipText(cleanedSubject, 180),
      requiresManualReview:
        author === 'Unknown' || this.isGenericInquirySubject(cleanedSubject),
    };
  }

  private mergeNote(existing: string | null | undefined, lines: string[]) {
    const base = existing ?? '';
    const additions = lines
      .map((line) => this.compactWhitespace(line))
      .filter((line) => !!line && !base.includes(line));
    if (additions.length === 0) {
      return base || null;
    }
    return [base, ...additions].filter(Boolean).join('\n');
  }

  private extractDemandCount(note: string | null | undefined) {
    const matches = this.extractDemandMatches(note);
    return Math.max(1, matches.length);
  }

  private inferConfidenceScore(lead: {
    title: string;
    author: string;
    note?: string | null;
  }) {
    let score = 50;
    const title = this.compactWhitespace(lead.title);
    const note = lead.note ?? '';

    if (title && !/^\[faker\]\s*inquiry\s*#\d+$/i.test(title)) score += 25;
    if (lead.author && lead.author !== 'Unknown') score += 15;
    if (/User message:/i.test(note)) score += 5;
    if (/ISBN[:\s]/i.test(note)) score += 5;
    if (/Needs manual review/i.test(note)) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private confidenceBand(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 80) return 'HIGH';
    if (score >= 55) return 'MEDIUM';
    return 'LOW';
  }

  private serializeLead(lead: {
    id: string;
    title: string;
    author: string;
    note: string | null;
    source: string;
    status: BookLeadStatus;
    priority: number;
    requestedByUserId: string | null;
    assignedToUserId: string | null;
    convertedBookId: string | null;
    procurementIsbn?: string | null;
    procurementPrice?: Prisma.Decimal | number | null;
    procurementCategories?: string[];
    procurementGenres?: string[];
    procurementDescription?: string | null;
    procurementCoverImage?: string | null;
    procurementStock?: number | null;
    procurementWarehouseId?: string | null;
    procurementQuantity?: number | null;
    procurementEstimatedCost?: Prisma.Decimal | number | null;
    procurementReviewNote?: string | null;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const confidenceScore = this.inferConfidenceScore(lead);
    return {
      ...lead,
      procurementPrice:
        lead.procurementPrice != null ? Number(lead.procurementPrice) : null,
      procurementEstimatedCost:
        lead.procurementEstimatedCost != null
          ? Number(lead.procurementEstimatedCost)
          : null,
      confidenceScore,
      confidenceBand: this.confidenceBand(confidenceScore),
      demandCount: this.extractDemandCount(lead.note),
    };
  }

  async list(actorUserId: string, query: ListBookLeadsDto) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const page = this.clamp(query.page, 1, 10000);
    const limit = this.clamp(query.limit, 20, 100);
    const skip = (page - 1) * limit;

    const requestedBySearch = query.requestedBy?.trim();
    const assignedToSearch = query.assignedTo?.trim();
    const authorSearch = query.author?.trim();
    const createdFrom = query.createdFrom
      ? new Date(`${query.createdFrom}T00:00:00.000Z`)
      : null;
    const createdTo = query.createdTo
      ? new Date(`${query.createdTo}T23:59:59.999Z`)
      : null;

    const [requestedByIds, assignedToIds] = await Promise.all([
      requestedBySearch
        ? this.prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: requestedBySearch, mode: 'insensitive' } },
                { email: { contains: requestedBySearch, mode: 'insensitive' } },
              ],
            },
            select: { id: true },
            take: 100,
          })
        : Promise.resolve([]),
      assignedToSearch
        ? this.prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: assignedToSearch, mode: 'insensitive' } },
                { email: { contains: assignedToSearch, mode: 'insensitive' } },
              ],
            },
            select: { id: true },
            take: 100,
          })
        : Promise.resolve([]),
    ]);

    const stageStatuses: Partial<Record<BookLeadWorkflowStage, BookLeadStatus[]>> = {
      [BookLeadWorkflowStage.NEW]: [BookLeadStatus.NEW],
      [BookLeadWorkflowStage.IN_REVIEW]: [
        BookLeadStatus.REVIEWED,
        BookLeadStatus.SOURCING,
      ],
      [BookLeadWorkflowStage.APPROVED]: [BookLeadStatus.APPROVED_TO_BUY],
      [BookLeadWorkflowStage.CLOSED]: [
        BookLeadStatus.ORDERED,
        BookLeadStatus.CONVERTED_TO_BOOK,
      ],
      [BookLeadWorkflowStage.REJECTED]: [BookLeadStatus.REJECTED],
    };

    const where: Prisma.BookLeadWhereInput = {
      ...(query.view === BookLeadView.TRASHED
        ? { deletedAt: { not: null } }
        : query.view === BookLeadView.ALL
          ? {}
          : { deletedAt: null }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.stage
        ? {
            status: {
              in: stageStatuses[query.stage] ?? [],
            },
          }
        : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(authorSearch
        ? {
            author: { contains: authorSearch, mode: 'insensitive' },
          }
        : {}),
      ...(createdFrom || createdTo
        ? {
            createdAt: {
              ...(createdFrom ? { gte: createdFrom } : {}),
              ...(createdTo ? { lte: createdTo } : {}),
            },
          }
        : {}),
      ...(requestedBySearch
        ? {
            requestedByUserId: {
              in: requestedByIds.map((user) => user.id),
            },
          }
        : {}),
      ...(assignedToSearch
        ? {
            assignedToUserId: {
              in: assignedToIds.map((user) => user.id),
            },
          }
        : {}),
      ...(query.q?.trim()
        ? {
            OR: [
              { title: { contains: query.q.trim(), mode: 'insensitive' } },
              { author: { contains: query.q.trim(), mode: 'insensitive' } },
              { note: { contains: query.q.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.bookLead.count({ where }),
      this.prisma.bookLead.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const userIds = Array.from(
      new Set(
        rows
          .flatMap((row) => [row.requestedByUserId, row.assignedToUserId])
          .filter((id): id is string => !!id),
      ),
    );

    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: rows.map((row) => ({
        ...this.serializeLead(row),
        requestedByUser: row.requestedByUserId
          ? (userMap.get(row.requestedByUserId) ?? null)
          : null,
        assignedToUser: row.assignedToUserId
          ? (userMap.get(row.assignedToUserId) ?? null)
          : null,
      })),
    };
  }

  async create(actorUserId: string, dto: CreateBookLeadDto) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    return this.prisma.bookLead.create({
      data: {
        title: dto.title.trim(),
        author: dto.author.trim(),
        note: dto.note?.trim(),
        source: dto.source,
        status: BookLeadStatus.NEW,
        priority: dto.priority ?? 3,
        requestedByUserId: dto.requestedByUserId ?? actorUserId,
      },
    });
  }

  async remove(actorUserId: string, id: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const lead = await this.prisma.bookLead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Book lead not found.');
    }

    if (lead.deletedAt) {
      throw new BadRequestException('Book lead is already in bin.');
    }

    return this.prisma.bookLead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(actorUserId: string, id: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const lead = await this.prisma.bookLead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Book lead not found.');
    }

    if (!lead.deletedAt) {
      throw new BadRequestException('Book lead is not in bin.');
    }

    return this.prisma.bookLead.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async importFromStockInquiries(
    actorUserId: string,
    params?: { limit?: number; defaultPriority?: number },
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const limit = this.clamp(params?.limit, 100, 500);
    const defaultPriority = this.clamp(params?.defaultPriority, 3, 5);

    const inquiries = await this.prisma.inquiry.findMany({
      where: {
        type: {
          in: [InquiryType.stock, InquiryType.other],
        },
        status: {
          in: [
            InquiryStatus.OPEN,
            InquiryStatus.ASSIGNED,
            InquiryStatus.IN_PROGRESS,
            InquiryStatus.ESCALATED,
          ],
        },
      },
      select: {
        id: true,
        type: true,
        subject: true,
        createdByUserId: true,
        messages: {
          where: {
            senderType: InquirySenderType.USER,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
          select: {
            message: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    let created = 0;
    let updated = 0;
    let skippedCatalogMatch = 0;

    for (const inquiry of inquiries) {
      const firstUserMessage = inquiry.messages[0]?.message ?? '';
      if (
        inquiry.type !== InquiryType.stock &&
        !this.isLikelyStockInquiry(inquiry.subject, firstUserMessage)
      ) {
        continue;
      }

      const parsed = this.parseInquiryLeadData(
        inquiry.subject,
        firstUserMessage,
        inquiry.id,
      );
      if (!parsed.title) {
        continue;
      }

      const inquiryLink = this.buildInquiryLink(inquiry.id);
      const legacyInquiryLink = `Linked stock inquiry: ${inquiry.id}`;
      const noteLines = [
        inquiryLink,
        parsed.subjectPreview
          ? `Original subject: ${parsed.subjectPreview}`
          : '',
        parsed.messagePreview ? `User message: ${parsed.messagePreview}` : '',
        parsed.requiresManualReview
          ? 'Needs manual review: title/author could not be fully detected.'
          : '',
      ];

      const existingLeadByInquiry = await this.prisma.bookLead.findFirst({
        where: {
          status: {
            not: BookLeadStatus.CONVERTED_TO_BOOK,
          },
          OR: [
            {
              note: {
                contains: inquiryLink,
                mode: 'insensitive',
              },
            },
            {
              note: {
                contains: legacyInquiryLink,
                mode: 'insensitive',
              },
            },
          ],
        },
      });
      if (existingLeadByInquiry) {
        const hasPlaceholderTitle = this.isPlaceholderLeadTitle(
          existingLeadByInquiry.title,
        );
        await this.prisma.bookLead.update({
          where: { id: existingLeadByInquiry.id },
          data: {
            title: hasPlaceholderTitle
              ? parsed.title
              : existingLeadByInquiry.title,
            author:
              existingLeadByInquiry.author === 'Unknown' &&
              parsed.author !== 'Unknown'
                ? parsed.author
                : existingLeadByInquiry.author,
            priority: Math.min(existingLeadByInquiry.priority, defaultPriority),
            note: this.mergeNote(existingLeadByInquiry.note, noteLines),
          },
        });
        updated += 1;
        continue;
      }

      const catalogMatch = await this.prisma.book.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { title: { equals: parsed.title, mode: 'insensitive' } },
            {
              title: {
                contains: parsed.title,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: { id: true },
      });

      if (catalogMatch) {
        skippedCatalogMatch += 1;
        continue;
      }

      const existingLead = await this.prisma.bookLead.findFirst({
        where: {
          status: {
            not: BookLeadStatus.CONVERTED_TO_BOOK,
          },
          title: { equals: parsed.title, mode: 'insensitive' },
          author: { equals: parsed.author, mode: 'insensitive' },
        },
      });

      if (existingLead) {
        await this.prisma.bookLead.update({
          where: { id: existingLead.id },
          data: {
            priority: Math.min(existingLead.priority, defaultPriority),
            note: this.mergeNote(existingLead.note, noteLines),
          },
        });
        updated += 1;
        continue;
      }

      await this.prisma.bookLead.create({
        data: {
          title: parsed.title,
          author: parsed.author,
          source: 'USER_REQUEST',
          status: BookLeadStatus.NEW,
          priority: defaultPriority,
          requestedByUserId: inquiry.createdByUserId,
          note: this.mergeNote(null, noteLines),
        },
      });
      created += 1;
    }

    return {
      scanned: inquiries.length,
      created,
      updated,
      skippedCatalogMatch,
    };
  }

  async getDuplicateSuggestions(actorUserId: string, limit = 100) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const safeLimit = this.clamp(limit, 100, 500);
    const leads = await this.prisma.bookLead.findMany({
      where: {
        status: { not: BookLeadStatus.CONVERTED_TO_BOOK },
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    const bucket = new Map<string, typeof leads>();
    for (const lead of leads) {
      const key = `${this.normalizeText(lead.title)}|${this.normalizeText(lead.author)}`;
      const group = bucket.get(key) ?? [];
      group.push(lead);
      bucket.set(key, group);
    }

    const groups = Array.from(bucket.entries())
      .filter(([, group]) => group.length > 1)
      .map(([key, group]) => ({
        dedupeKey: key,
        count: group.length,
        suggestedPrimaryLeadId: group[0].id,
        leads: group,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalGroups: groups.length,
      groups,
    };
  }

  async getDemandSummary(actorUserId: string, days = 90) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const safeDays = this.clamp(days, 90, 365);
    const fromDate = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
    const leads = await this.prisma.bookLead.findMany({
      where: {
        createdAt: { gte: fromDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const demandByKey = new Map<
      string,
      {
        key: string;
        title: string;
        author: string;
        count: number;
        openLeadCount: number;
        avgPriority: number;
        latestRequestAt: Date;
      }
    >();
    const authorDemand = new Map<string, number>();
    const confidenceBuckets = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    let convertedCount = 0;

    for (const lead of leads) {
      const serialized = this.serializeLead(lead);
      confidenceBuckets[serialized.confidenceBand] += 1;
      if (lead.status === BookLeadStatus.CONVERTED_TO_BOOK) {
        convertedCount += 1;
      }

      const key = `${this.normalizeText(lead.title)}|${this.normalizeText(lead.author)}`;
      const demand = serialized.demandCount;
      const prev = demandByKey.get(key);
      if (!prev) {
        demandByKey.set(key, {
          key,
          title: lead.title,
          author: lead.author,
          count: demand,
          openLeadCount:
            lead.status === BookLeadStatus.CONVERTED_TO_BOOK ||
            lead.status === BookLeadStatus.REJECTED
              ? 0
              : 1,
          avgPriority: lead.priority,
          latestRequestAt: lead.createdAt,
        });
      } else {
        const nextLeadCount =
          prev.openLeadCount +
          (lead.status === BookLeadStatus.CONVERTED_TO_BOOK ||
          lead.status === BookLeadStatus.REJECTED
            ? 0
            : 1);
        demandByKey.set(key, {
          ...prev,
          count: prev.count + demand,
          openLeadCount: nextLeadCount,
          avgPriority:
            (prev.avgPriority * prev.openLeadCount + lead.priority) /
            Math.max(1, nextLeadCount),
          latestRequestAt:
            lead.createdAt > prev.latestRequestAt
              ? lead.createdAt
              : prev.latestRequestAt,
        });
      }

      const normalizedAuthor = this.compactWhitespace(lead.author) || 'Unknown';
      authorDemand.set(
        normalizedAuthor,
        (authorDemand.get(normalizedAuthor) ?? 0) + demand,
      );
    }

    const topRequestedBooks = Array.from(demandByKey.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const topAuthors = Array.from(authorDemand.entries())
      .map(([author, demand]) => ({ author, demand }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 10);

    const openLeads = leads.filter(
      (lead) =>
        lead.status !== BookLeadStatus.CONVERTED_TO_BOOK &&
        lead.status !== BookLeadStatus.REJECTED,
    ).length;

    return {
      days: safeDays,
      fromDate,
      kpis: {
        totalLeads: leads.length,
        openLeads,
        convertedCount,
        conversionRate:
          leads.length > 0
            ? Number((convertedCount / leads.length).toFixed(4))
            : 0,
        highConfidenceRatio:
          leads.length > 0
            ? Number((confidenceBuckets.HIGH / leads.length).toFixed(4))
            : 0,
      },
      confidenceBuckets,
      topRequestedBooks,
      topAuthors,
    };
  }

  async getRestockCandidates(actorUserId: string, days = 90, limit = 20) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const safeDays = this.clamp(days, 90, 365);
    const safeLimit = this.clamp(limit, 20, 100);
    const fromDate = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const [leads, orderItems] = await Promise.all([
      this.prisma.bookLead.findMany({
        where: {
          createdAt: { gte: fromDate },
          status: {
            notIn: [BookLeadStatus.CONVERTED_TO_BOOK, BookLeadStatus.REJECTED],
          },
        },
      }),
      this.prisma.orderItem.findMany({
        where: {
          createdAt: { gte: fromDate },
          order: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        },
        select: {
          bookId: true,
          quantity: true,
        },
      }),
    ]);

    const demandByTitle = new Map<string, number>();
    for (const lead of leads) {
      const key = this.normalizeText(lead.title);
      demandByTitle.set(
        key,
        (demandByTitle.get(key) ?? 0) + this.extractDemandCount(lead.note),
      );
    }

    const salesByBook = new Map<string, number>();
    for (const item of orderItems) {
      salesByBook.set(
        item.bookId,
        (salesByBook.get(item.bookId) ?? 0) + item.quantity,
      );
    }

    const books = await this.prisma.book.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        author: true,
        stock: true,
      },
      take: 1200,
    });

    const candidates = books
      .map((book) => {
        const demand = demandByTitle.get(this.normalizeText(book.title)) ?? 0;
        const salesQty = salesByBook.get(book.id) ?? 0;
        const lowStockPenalty =
          book.stock <= 5 ? 25 : book.stock <= 12 ? 10 : 0;
        const score = demand * 12 + salesQty * 3 + lowStockPenalty;
        const suggestedQty = Math.max(
          0,
          Math.ceil(demand * 1.4 + salesQty * 0.25 - book.stock),
        );
        return {
          bookId: book.id,
          title: book.title,
          author: book.author,
          currentStock: book.stock,
          demandCount: demand,
          salesQty,
          score,
          suggestedQty,
        };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit);

    return {
      days: safeDays,
      fromDate,
      items: candidates,
    };
  }

  async getPartnerPipeline(actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const partnerLeads = await this.prisma.bookLead.findMany({
      where: {
        source: 'PARTNER_PITCH',
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const byStatus = new Map<string, number>();
    let projectedShareSum = 0;
    const shareSamples: number[] = [];

    for (const lead of partnerLeads) {
      byStatus.set(lead.status, (byStatus.get(lead.status) ?? 0) + 1);
      const match = (lead.note ?? '').match(
        /(share|commission|profit)\s*[:=-]?\s*(\d{1,2}(?:\.\d+)?)\s*%/i,
      );
      if (match?.[2]) {
        const value = Number(match[2]);
        if (Number.isFinite(value)) {
          projectedShareSum += value;
          shareSamples.push(value);
        }
      }
    }

    return {
      totalPartnerLeads: partnerLeads.length,
      statusBreakdown: Array.from(byStatus.entries()).map(
        ([status, count]) => ({
          status,
          count,
        }),
      ),
      avgRevenueSharePct:
        shareSamples.length > 0
          ? Number((projectedShareSum / shareSamples.length).toFixed(2))
          : null,
      leads: partnerLeads.map((lead) => this.serializeLead(lead)),
    };
  }

  async applyWorkflowAutomation(
    actorUserId: string,
    input?: { promoteThreshold?: number; sourceThreshold?: number },
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const promoteThreshold = this.clamp(input?.promoteThreshold, 3, 20);
    const sourceThreshold = this.clamp(input?.sourceThreshold, 6, 30);

    const leads = await this.prisma.bookLead.findMany({
      where: {
        status: { in: [BookLeadStatus.NEW, BookLeadStatus.REVIEWED] },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    let movedToReviewed = 0;
    let movedToSourcing = 0;

    for (const lead of leads) {
      const demand = this.extractDemandCount(lead.note);
      const score = this.inferConfidenceScore(lead);
      if (
        lead.status === BookLeadStatus.NEW &&
        demand >= promoteThreshold &&
        score >= 55
      ) {
        await this.prisma.bookLead.update({
          where: { id: lead.id },
          data: {
            status: BookLeadStatus.REVIEWED,
            note: this.mergeNote(lead.note, [
              `Workflow: auto-promoted to REVIEWED on ${new Date().toISOString()}`,
            ]),
          },
        });
        movedToReviewed += 1;
        continue;
      }

      if (
        lead.status === BookLeadStatus.REVIEWED &&
        demand >= sourceThreshold &&
        score >= 70
      ) {
        await this.prisma.bookLead.update({
          where: { id: lead.id },
          data: {
            status: BookLeadStatus.SOURCING,
            note: this.mergeNote(lead.note, [
              `Workflow: auto-promoted to SOURCING on ${new Date().toISOString()}`,
            ]),
          },
        });
        movedToSourcing += 1;
      }
    }

    return {
      scanned: leads.length,
      movedToReviewed,
      movedToSourcing,
      thresholds: {
        promoteThreshold,
        sourceThreshold,
      },
    };
  }

  async mergeLeads(
    actorUserId: string,
    targetLeadId: string,
    duplicateLeadIds: string[],
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const uniqueIds = Array.from(
      new Set(duplicateLeadIds.filter((id) => id && id !== targetLeadId)),
    );
    if (uniqueIds.length === 0) {
      throw new BadRequestException(
        'At least one duplicate lead id is required for merge.',
      );
    }

    const [target, duplicates] = await Promise.all([
      this.prisma.bookLead.findUnique({ where: { id: targetLeadId } }),
      this.prisma.bookLead.findMany({
        where: {
          id: { in: uniqueIds },
        },
      }),
    ]);

    if (!target) {
      throw new NotFoundException('Target book lead not found');
    }
    if (duplicates.length !== uniqueIds.length) {
      throw new NotFoundException('One or more duplicate leads not found');
    }

    const mergedNote = [
      target.note,
      ...duplicates.map(
        (lead) =>
          `Merged ${lead.id}: ${lead.note ?? `${lead.title} by ${lead.author}`}`,
      ),
      `Merged by ${actorUserId} at ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join('\n');

    const mergedPriority = Math.min(
      target.priority,
      ...duplicates.map((lead) => lead.priority),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTarget = await tx.bookLead.update({
        where: { id: target.id },
        data: {
          priority: mergedPriority,
          note: mergedNote,
        },
      });

      for (const lead of duplicates) {
        await tx.bookLead.update({
          where: { id: lead.id },
          data: {
            status: BookLeadStatus.REJECTED,
            note: [lead.note, `Merged into lead ${target.id}`]
              .filter(Boolean)
              .join('\n'),
          },
        });
      }

      return updatedTarget;
    });

    return {
      target: result,
      mergedCount: duplicates.length,
      mergedLeadIds: duplicates.map((lead) => lead.id),
    };
  }

  async update(actorUserId: string, id: string, dto: UpdateBookLeadDto) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const existing = await this.prisma.bookLead.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Book lead not found');
    }
    if (
      existing.status === BookLeadStatus.CONVERTED_TO_BOOK &&
      dto.status !== BookLeadStatus.CONVERTED_TO_BOOK
    ) {
      throw new BadRequestException(
        'Converted book leads cannot be moved back to previous statuses.',
      );
    }

    return this.prisma.bookLead.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.author !== undefined ? { author: dto.author.trim() } : {}),
        ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.requestedByUserId !== undefined
          ? { requestedByUserId: dto.requestedByUserId || null }
          : {}),
        ...(dto.assignedToUserId !== undefined
          ? { assignedToUserId: dto.assignedToUserId || null }
          : {}),
        ...(dto.procurementIsbn !== undefined
          ? { procurementIsbn: dto.procurementIsbn?.trim() || null }
          : {}),
        ...(dto.procurementPrice !== undefined
          ? { procurementPrice: dto.procurementPrice }
          : {}),
        ...(dto.procurementCategories !== undefined
          ? {
              procurementCategories: dto.procurementCategories
                .map((item) => item.trim())
                .filter(Boolean),
            }
          : {}),
        ...(dto.procurementGenres !== undefined
          ? {
              procurementGenres: dto.procurementGenres
                .map((item) => item.trim())
                .filter(Boolean),
            }
          : {}),
        ...(dto.procurementDescription !== undefined
          ? {
              procurementDescription:
                dto.procurementDescription?.trim() || null,
            }
          : {}),
        ...(dto.procurementCoverImage !== undefined
          ? { procurementCoverImage: dto.procurementCoverImage?.trim() || null }
          : {}),
        ...(dto.procurementStock !== undefined
          ? { procurementStock: dto.procurementStock }
          : {}),
        ...(dto.procurementWarehouseId !== undefined
          ? {
              procurementWarehouseId:
                dto.procurementWarehouseId?.trim() || null,
            }
          : {}),
        ...(dto.procurementQuantity !== undefined
          ? { procurementQuantity: dto.procurementQuantity }
          : {}),
        ...(dto.procurementEstimatedCost !== undefined
          ? { procurementEstimatedCost: dto.procurementEstimatedCost }
          : {}),
        ...(dto.procurementReviewNote !== undefined
          ? {
              procurementReviewNote: dto.procurementReviewNote?.trim() || null,
            }
          : {}),
      },
    });
  }

  async convertToBook(
    actorUserId: string,
    id: string,
    dto: ConvertBookLeadDto,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const lead = await this.prisma.bookLead.findUnique({
      where: { id },
    });
    if (!lead) {
      throw new NotFoundException('Book lead not found');
    }
    if (lead.status === BookLeadStatus.CONVERTED_TO_BOOK) {
      throw new BadRequestException('Book lead is already converted.');
    }

    const isbn = dto.isbn.trim();
    const existingBook = await this.prisma.book.findUnique({
      where: { isbn },
      select: { id: true },
    });
    if (existingBook) {
      throw new BadRequestException('ISBN already exists in catalog.');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          title: dto.title?.trim() || lead.title,
          author: dto.author?.trim() || lead.author,
          isbn,
          price: dto.price,
          categories: dto.categories,
          genres: dto.genres ?? [],
          stock: dto.stock ?? 0,
          description: dto.description?.trim(),
          coverImage: dto.coverImage?.trim(),
        },
      });

      const updatedLead = await tx.bookLead.update({
        where: { id: lead.id },
        data: {
          status: BookLeadStatus.CONVERTED_TO_BOOK,
          convertedBookId: book.id,
          note: [
            lead.note,
            `Converted by ${actorUserId} on ${new Date().toISOString()}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      });

      return { book, lead: updatedLead };
    });

    return created;
  }
}
