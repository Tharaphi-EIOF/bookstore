import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { resolveUserPermissionKeys } from './permission-resolution';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const baseUserSelect = {
  id: true,
  clerkUserId: true,
  email: true,
  password: true,
  name: true,
  role: true,
  isActive: true,
  avatarType: true,
  avatarValue: true,
  backgroundColor: true,
  pronouns: true,
  shortBio: true,
  about: true,
  coverImage: true,
  location: true,
  website: true,
  timezone: true,
  language: true,
  showEmail: true,
  showFollowers: true,
  showFollowing: true,
  showFavorites: true,
  showLikedPosts: true,
  emailUpdatesEnabled: true,
  followerAlertsEnabled: true,
  marketingEmailsEnabled: true,
  supportEnabled: true,
  supportUrl: true,
  supportQrImage: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type SessionRequestUser = {
  sub: string;
  clerkUserId: string | null;
  email: string;
  role: Role;
  permissions: string[];
};

@Injectable()
export class AuthService {
  private readonly clerkSecretKey: string | null;
  private readonly clerkClient: ReturnType<typeof createClerkClient> | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.clerkSecretKey =
      this.configService.get<string>('CLERK_SECRET_KEY') ?? null;
    this.clerkClient = this.clerkSecretKey
      ? createClerkClient({
          secretKey: this.clerkSecretKey,
        })
      : null;
  }

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(dto.password, bcryptRounds);

    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.name.trim(),
        password: hashedPassword,
      },
      select: baseUserSelect,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: this.buildSessionUserSelect(),
    });

    if (!user) {
      throw new UnauthorizedException(
        'No account found with this email address',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses Clerk sign-in. Continue with the hosted sign-in flow.',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    this.assertActiveUser(user);

    const payload = await this.buildLocalJwtPayload(user);

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async authenticateBearerToken(token: string): Promise<SessionRequestUser> {
    try {
      return await this.authenticateLegacyJwt(token);
    } catch (legacyError) {
      const clerkUser = await this.tryAuthenticateWithClerk(token);
      if (clerkUser) {
        return clerkUser;
      }

      throw legacyError;
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.getSessionUserOrThrow(userId);
    return {
      user: await this.buildSessionUserResponse(user),
    };
  }

  async getMyPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }

    const permissions = Array.from(
      await resolveUserPermissionKeys(this.prisma, userId),
    ).sort();

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.avatarType !== undefined ? { avatarType: dto.avatarType } : {}),
        ...(dto.avatarValue !== undefined
          ? { avatarValue: dto.avatarValue }
          : {}),
        ...(dto.backgroundColor !== undefined
          ? { backgroundColor: dto.backgroundColor }
          : {}),
        ...(dto.pronouns !== undefined
          ? { pronouns: dto.pronouns.trim() || null }
          : {}),
        ...(dto.shortBio !== undefined
          ? { shortBio: dto.shortBio.trim() || null }
          : {}),
        ...(dto.about !== undefined ? { about: dto.about.trim() || null } : {}),
        ...(dto.location !== undefined
          ? { location: dto.location.trim() || null }
          : {}),
        ...(dto.website !== undefined
          ? { website: dto.website.trim() || null }
          : {}),
        ...(dto.timezone !== undefined
          ? { timezone: dto.timezone.trim() || 'UTC' }
          : {}),
        ...(dto.language !== undefined
          ? { language: dto.language.trim() || 'en' }
          : {}),
        ...(dto.coverImage !== undefined
          ? { coverImage: dto.coverImage.trim() || null }
          : {}),
        ...(dto.showEmail !== undefined ? { showEmail: dto.showEmail } : {}),
        ...(dto.showFollowers !== undefined
          ? { showFollowers: dto.showFollowers }
          : {}),
        ...(dto.showFollowing !== undefined
          ? { showFollowing: dto.showFollowing }
          : {}),
        ...(dto.showFavorites !== undefined
          ? { showFavorites: dto.showFavorites }
          : {}),
        ...(dto.showLikedPosts !== undefined
          ? { showLikedPosts: dto.showLikedPosts }
          : {}),
        ...(dto.emailUpdatesEnabled !== undefined
          ? { emailUpdatesEnabled: dto.emailUpdatesEnabled }
          : {}),
        ...(dto.followerAlertsEnabled !== undefined
          ? { followerAlertsEnabled: dto.followerAlertsEnabled }
          : {}),
        ...(dto.marketingEmailsEnabled !== undefined
          ? { marketingEmailsEnabled: dto.marketingEmailsEnabled }
          : {}),
        ...(dto.supportEnabled !== undefined
          ? { supportEnabled: dto.supportEnabled }
          : {}),
        ...(dto.supportUrl !== undefined
          ? { supportUrl: dto.supportUrl.trim() || null }
          : {}),
        ...(dto.supportQrImage !== undefined
          ? { supportQrImage: dto.supportQrImage.trim() || null }
          : {}),
      },
      select: baseUserSelect,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return {
        message:
          'If an account exists with this email, a reset token has been generated.',
      };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const token =
      randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      message:
        'If an account exists with this email, a reset token has been generated.',
      resetToken: token,
      expiresAt,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, bcryptRounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      message: 'Password has been reset successfully.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }

    if (!user.password) {
      throw new BadRequestException(
        'This account does not use a local password. Continue with your hosted sign-in provider.',
      );
    }

    const passwordMatch = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, bcryptRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password changed successfully.',
    };
  }

  private async tryAuthenticateWithClerk(
    token: string,
  ): Promise<SessionRequestUser | null> {
    if (!this.clerkSecretKey || !this.clerkClient) {
      return null;
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: this.clerkSecretKey,
        jwtKey: this.configService.get<string>('CLERK_JWT_KEY') || undefined,
        authorizedParties: this.getAuthorizedParties(),
      });

      const clerkUserId = payload.sub;
      if (!clerkUserId) {
        return null;
      }

      const localUser = await this.resolveLocalUserFromClerk(clerkUserId);
      const permissions = Array.from(
        await resolveUserPermissionKeys(this.prisma, localUser.id),
      );

      return {
        sub: localUser.id,
        clerkUserId: localUser.clerkUserId,
        email: localUser.email,
        role: localUser.role,
        permissions,
      };
    } catch {
      return null;
    }
  }

  private async authenticateLegacyJwt(
    token: string,
  ): Promise<SessionRequestUser> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: string;
      }>(token);

      if (!payload.sub) {
        throw new UnauthorizedException(
          'Invalid user session. Please login again.',
        );
      }

      const user = await this.getSessionUserOrThrow(payload.sub);
      const permissions = Array.from(
        await resolveUserPermissionKeys(this.prisma, user.id),
      );

      return {
        sub: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        role: user.role,
        permissions,
      };
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token.',
      );
    }
  }

  private async resolveLocalUserFromClerk(clerkUserId: string) {
    if (!this.clerkClient) {
      throw new UnauthorizedException('Clerk authentication is not enabled.');
    }

    const clerkUser = await this.clerkClient.users.getUser(clerkUserId);
    const normalizedEmail = this.resolvePrimaryClerkEmail(clerkUser);
    const displayName = this.resolveClerkDisplayName(
      clerkUser,
      normalizedEmail,
    );

    const existingByClerkId = await this.prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, clerkUserId: true, email: true, name: true },
    });

    if (existingByClerkId) {
      await this.updateLinkedClerkUser(existingByClerkId.id, {
        email: normalizedEmail,
        name: displayName,
      });
      return this.getSessionUserOrThrow(existingByClerkId.id);
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, clerkUserId: true },
    });

    if (existingByEmail) {
      if (
        existingByEmail.clerkUserId &&
        existingByEmail.clerkUserId !== clerkUserId
      ) {
        throw new UnauthorizedException(
          'This email is already linked to a different account.',
        );
      }

      await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkUserId,
          name: displayName,
        },
      });

      return this.getSessionUserOrThrow(existingByEmail.id);
    }

    const createdUser = await this.prisma.user.create({
      data: {
        clerkUserId,
        email: normalizedEmail,
        name: displayName,
        password: null,
      },
      select: { id: true },
    });

    return this.getSessionUserOrThrow(createdUser.id);
  }

  private async updateLinkedClerkUser(
    userId: string,
    data: { email: string; name: string },
  ) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: data.email,
          name: data.name,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UnauthorizedException(
          'Unable to link Clerk account because the email is already in use.',
        );
      }

      throw error;
    }
  }

  private resolvePrimaryClerkEmail(clerkUser: {
    primaryEmailAddressId: string | null;
    emailAddresses: Array<{ id: string; emailAddress: string }>;
  }) {
    const primaryEmail =
      clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      throw new UnauthorizedException(
        'Clerk account is missing a verified email address.',
      );
    }

    return primaryEmail.trim().toLowerCase();
  }

  private resolveClerkDisplayName(
    clerkUser: {
      firstName: string | null;
      lastName: string | null;
      username: string | null;
    },
    fallbackEmail: string,
  ) {
    const fullName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || clerkUser.username || fallbackEmail.split('@')[0];
  }

  private async getSessionUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.buildSessionUserSelect(),
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }

    this.assertActiveUser(user);
    return user;
  }

  private assertActiveUser(user: { isActive: boolean }) {
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been restricted. Please contact support.',
      );
    }
  }

  private buildSessionUserSelect() {
    return {
      ...baseUserSelect,
      staffProfile: {
        select: {
          id: true,
          employeeCode: true,
          status: true,
          title: true,
          department: {
            select: {
              name: true,
              code: true,
            },
          },
          assignments: {
            where: {
              OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
              effectiveFrom: {
                lte: new Date(),
              },
            },
            orderBy: {
              effectiveFrom: 'desc' as const,
            },
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.UserSelect;
  }

  private async buildLocalJwtPayload(
    user: Prisma.UserGetPayload<{
      select: ReturnType<AuthService['buildSessionUserSelect']>;
    }>,
  ) {
    const permissions = Array.from(
      await resolveUserPermissionKeys(this.prisma, user.id),
    );
    const staffRoles =
      user.staffProfile?.assignments.map((assignment) => ({
        id: assignment.role.id,
        name: assignment.role.name,
        code: assignment.role.code,
      })) ?? [];
    const primaryStaffRole = staffRoles[0] ?? null;

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
      name: user.name,
      avatarType: user.avatarType,
      avatarValue: user.avatarValue,
      backgroundColor: user.backgroundColor,
      pronouns: user.pronouns,
      shortBio: user.shortBio,
      about: user.about,
      coverImage: user.coverImage,
      location: user.location,
      website: user.website,
      timezone: user.timezone,
      language: user.language,
      showEmail: user.showEmail,
      showFollowers: user.showFollowers,
      showFollowing: user.showFollowing,
      showFavorites: user.showFavorites,
      showLikedPosts: user.showLikedPosts,
      emailUpdatesEnabled: user.emailUpdatesEnabled,
      followerAlertsEnabled: user.followerAlertsEnabled,
      marketingEmailsEnabled: user.marketingEmailsEnabled,
      supportEnabled: user.supportEnabled,
      supportUrl: user.supportUrl,
      supportQrImage: user.supportQrImage,
      staffTitle: user.staffProfile?.title,
      staffDepartmentName: user.staffProfile?.department.name,
      staffDepartmentCode: user.staffProfile?.department.code,
      staffProfileId: user.staffProfile?.id,
      staffEmployeeCode: user.staffProfile?.employeeCode,
      isStaff: !!user.staffProfile?.id,
      staffStatus: user.staffProfile?.status,
      staffRoles,
      primaryStaffRoleName: primaryStaffRole?.name,
      primaryStaffRoleCode: primaryStaffRole?.code,
    };
  }

  private async buildSessionUserResponse(
    user: Prisma.UserGetPayload<{
      select: ReturnType<AuthService['buildSessionUserSelect']>;
    }>,
  ) {
    const permissions = Array.from(
      await resolveUserPermissionKeys(this.prisma, user.id),
    ).sort();
    const staffRoles =
      user.staffProfile?.assignments.map((assignment) => ({
        id: assignment.role.id,
        name: assignment.role.name,
        code: assignment.role.code,
      })) ?? [];
    const primaryStaffRole = staffRoles[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isStaff: !!user.staffProfile?.id,
      staffStatus: user.staffProfile?.status ?? null,
      permissions,
      staffRoles,
      primaryStaffRoleName: primaryStaffRole?.name ?? null,
      primaryStaffRoleCode: primaryStaffRole?.code ?? null,
      staffTitle: user.staffProfile?.title ?? null,
      staffDepartmentName: user.staffProfile?.department.name ?? null,
      staffDepartmentCode: user.staffProfile?.department.code ?? null,
      staffProfileId: user.staffProfile?.id ?? null,
      staffEmployeeCode: user.staffProfile?.employeeCode ?? null,
      avatarType: user.avatarType || 'emoji',
      avatarValue: user.avatarValue,
      backgroundColor: user.backgroundColor,
      pronouns: user.pronouns,
      shortBio: user.shortBio,
      about: user.about,
      coverImage: user.coverImage,
      location: user.location,
      website: user.website,
      timezone: user.timezone,
      language: user.language,
      showEmail: user.showEmail,
      showFollowers: user.showFollowers,
      showFollowing: user.showFollowing,
      showFavorites: user.showFavorites,
      showLikedPosts: user.showLikedPosts,
      emailUpdatesEnabled: user.emailUpdatesEnabled,
      followerAlertsEnabled: user.followerAlertsEnabled,
      marketingEmailsEnabled: user.marketingEmailsEnabled,
      supportEnabled: user.supportEnabled,
      supportUrl: user.supportUrl,
      supportQrImage: user.supportQrImage,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private getAuthorizedParties() {
    const configured = this.configService
      .get<string>('CLERK_AUTHORIZED_PARTIES')
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (configured && configured.length > 0) {
      return configured;
    }

    const corsOrigin = this.configService.get<string>('CORS_ORIGIN');
    return corsOrigin ? [corsOrigin] : undefined;
  }
}
