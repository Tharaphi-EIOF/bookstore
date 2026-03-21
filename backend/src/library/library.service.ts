import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }
  }

  private async ensureBook(bookId: string) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
  }

  async getWishlist(userId: string) {
    await this.ensureUser(userId);
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWishlist(userId: string, bookId: string) {
    await this.ensureUser(userId);
    await this.ensureBook(bookId);
    return this.prisma.wishlistItem.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {},
      create: { userId, bookId },
      include: { book: true },
    });
  }

  async removeFromWishlist(userId: string, bookId: string) {
    await this.ensureUser(userId);
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (!existing) {
      throw new NotFoundException('Wishlist item not found');
    }
    return this.prisma.wishlistItem.delete({
      where: { id: existing.id },
      include: { book: true },
    });
  }

  async listStockAlerts(userId: string) {
    await this.ensureUser(userId);
    return this.prisma.stockAlertSubscription.findMany({
      where: { userId },
      include: { book: true },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async subscribeToStockAlert(userId: string, bookId: string) {
    await this.ensureUser(userId);
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if ((book.stock ?? 0) > 0) {
      throw new NotFoundException(
        'This book is already back in stock. You do not need an alert.',
      );
    }
    return this.prisma.stockAlertSubscription.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {
        isActive: true,
        notifiedAt: null,
      },
      create: { userId, bookId },
      include: { book: true },
    });
  }

  async unsubscribeFromStockAlert(userId: string, bookId: string) {
    await this.ensureUser(userId);
    const existing = await this.prisma.stockAlertSubscription.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (!existing) {
      throw new NotFoundException('Stock alert not found');
    }
    return this.prisma.stockAlertSubscription.update({
      where: { id: existing.id },
      data: { isActive: false },
      include: { book: true },
    });
  }

  async getFavorites(userId: string) {
    await this.ensureUser(userId);
    return this.prisma.favoriteItem.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToFavorites(userId: string, bookId: string) {
    await this.ensureUser(userId);
    await this.ensureBook(bookId);
    return this.prisma.favoriteItem.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {},
      create: { userId, bookId },
      include: { book: true },
    });
  }

  async removeFromFavorites(userId: string, bookId: string) {
    await this.ensureUser(userId);
    const existing = await this.prisma.favoriteItem.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (!existing) {
      throw new NotFoundException('Favorite item not found');
    }
    return this.prisma.favoriteItem.delete({
      where: { id: existing.id },
      include: { book: true },
    });
  }
}
