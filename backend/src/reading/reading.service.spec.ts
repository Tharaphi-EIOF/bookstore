import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ReadingStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ReadingService } from './reading.service';

describe('ReadingService', () => {
  let service: ReadingService;
  let prisma: any;

  const userId = 'user-1';
  const bookId = 'book-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            book: {
              findUnique: jest.fn(),
            },
            readingItem: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            ebookProgress: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
            userBookAccess: {
              findUnique: jest.fn(),
            },
            orderItem: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            readingSession: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReadingService>(ReadingService);
    prisma = module.get(PrismaService);

    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.book.findUnique.mockResolvedValue({ id: bookId });
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.readingSession.create.mockResolvedValue({
      id: 'session-1',
      userId,
      bookId,
      readingItemId: 'ri-1',
      pagesRead: 1,
      sessionDate: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.readingSession.delete.mockResolvedValue({
      id: 'session-1',
      userId,
      bookId,
      readingItemId: 'ri-1',
      pagesRead: 1,
      sessionDate: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      book: { id: bookId, title: 'Book A' },
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyBooks', () => {
    it('returns items with computed progress', async () => {
      prisma.readingItem.findMany.mockResolvedValue([
        {
          id: 'ri-1',
          userId,
          bookId,
          status: ReadingStatus.READING,
          currentPage: 40,
          totalPages: 200,
          dailyGoalPages: 10,
          startedAt: new Date(),
          finishedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          book: { id: bookId, title: 'Book A' },
        },
      ]);

      const result = await service.getMyBooks(
        userId,
        ReadingStatus.READING,
        bookId,
      );

      expect(prisma.readingItem.findMany).toHaveBeenCalledWith({
        where: { userId, status: ReadingStatus.READING, bookId },
        include: { book: true },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result[0].progressPercent).toBe(20);
    });

    it('throws when user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMyBooks(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('addBook', () => {
    it('upserts reading item for valid payload', async () => {
      const now = new Date();
      prisma.readingItem.upsert.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.TO_READ,
        currentPage: 0,
        totalPages: 300,
        dailyGoalPages: 20,
        startedAt: null,
        finishedAt: null,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.addBook(userId, bookId, {
        status: ReadingStatus.TO_READ,
        currentPage: 0,
        totalPages: 300,
        dailyGoalPages: 20,
      });

      expect(prisma.readingItem.upsert).toHaveBeenCalled();
      expect(result.progressPercent).toBe(0);
    });

    it('throws when current page exceeds total pages', async () => {
      await expect(
        service.addBook(userId, bookId, {
          currentPage: 301,
          totalPages: 300,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when book is missing', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.addBook(userId, bookId, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('updates status and sets finishedAt for FINISHED', async () => {
      const now = new Date();
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.READING,
        startedAt: now,
        finishedAt: null,
      });
      prisma.readingItem.update.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.FINISHED,
        currentPage: 100,
        totalPages: 100,
        dailyGoalPages: 10,
        startedAt: now,
        finishedAt: now,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.updateStatus(userId, bookId, {
        status: ReadingStatus.FINISHED,
      });

      expect(prisma.readingItem.update).toHaveBeenCalled();
      expect(result.status).toBe(ReadingStatus.FINISHED);
      expect(result.finishedAt).toBeTruthy();
    });

    it('throws when tracked item is missing', async () => {
      prisma.readingItem.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus(userId, bookId, { status: ReadingStatus.READING }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProgress', () => {
    it('infers FINISHED when current page reaches total pages', async () => {
      const now = new Date();
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.READING,
        currentPage: 20,
        totalPages: 100,
        startedAt: now,
        finishedAt: null,
      });
      prisma.readingItem.update.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.FINISHED,
        currentPage: 100,
        totalPages: 100,
        dailyGoalPages: 10,
        startedAt: now,
        finishedAt: now,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.updateProgress(userId, bookId, {
        currentPage: 100,
        totalPages: 100,
      });

      expect(result.status).toBe(ReadingStatus.FINISHED);
      expect(result.progressPercent).toBe(100);
    });

    it('throws when current page exceeds total pages', async () => {
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.READING,
        currentPage: 20,
        totalPages: 200,
        startedAt: new Date(),
        finishedAt: null,
      });

      await expect(
        service.updateProgress(userId, bookId, {
          currentPage: 201,
          totalPages: 200,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateDailyGoal', () => {
    it('updates daily goal and supports clearing it', async () => {
      const now = new Date();
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
      });
      prisma.readingItem.update.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.READING,
        currentPage: 10,
        totalPages: 100,
        dailyGoalPages: null,
        startedAt: now,
        finishedAt: null,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.updateDailyGoal(userId, bookId, {});

      expect(prisma.readingItem.update).toHaveBeenCalledWith({
        where: { userId_bookId: { userId, bookId } },
        data: { dailyGoalPages: null },
        include: { book: true },
      });
      expect(result.dailyGoalPages).toBeNull();
    });
  });

  describe('removeBook', () => {
    it('deletes tracked item', async () => {
      const now = new Date();
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
      });
      prisma.readingItem.delete.mockResolvedValue({
        id: 'ri-1',
        userId,
        bookId,
        status: ReadingStatus.TO_READ,
        currentPage: 0,
        totalPages: null,
        dailyGoalPages: null,
        startedAt: null,
        finishedAt: null,
        createdAt: now,
        updatedAt: now,
        book: { id: bookId, title: 'Book A' },
      });

      const result = await service.removeBook(userId, bookId);

      expect(prisma.readingItem.delete).toHaveBeenCalledWith({
        where: { userId_bookId: { userId, bookId } },
        include: { book: true },
      });
      expect(result.bookId).toBe(bookId);
    });
  });

  describe('removeSession', () => {
    it('deletes an existing session for the user', async () => {
      prisma.readingSession.findFirst.mockResolvedValueOnce({ id: 'session-1' });

      const result = await service.removeSession(userId, 'session-1');

      expect(prisma.readingSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        include: { book: true },
      });
      expect(result.id).toBe('session-1');
    });

    it('throws when session does not exist', async () => {
      prisma.readingSession.findFirst.mockResolvedValueOnce(null);

      await expect(service.removeSession(userId, 'missing-session')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEbookProgress', () => {
    it('creates a reading session when ebook page advances', async () => {
      const now = new Date();
      prisma.book.findUnique.mockResolvedValue({
        id: bookId,
        title: 'Book A',
        isDigital: true,
        ebookFormat: 'EPUB',
        ebookFilePath: 'book-a.epub',
        totalPages: 300,
      });
      prisma.userBookAccess.findUnique.mockResolvedValue({
        id: 'access-1',
        userId,
        bookId,
      });
      prisma.ebookProgress.findUnique.mockResolvedValue({
        id: 'ep-1',
        userId,
        bookId,
        page: 10,
        locationCfi: 'cfi-10',
        percent: 3.33,
        createdAt: now,
        updatedAt: now,
      });
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        currentPage: 10,
      });
      prisma.ebookProgress.upsert.mockResolvedValue({
        id: 'ep-1',
        userId,
        bookId,
        page: 16,
        locationCfi: 'cfi-10',
        percent: 5.33,
        createdAt: now,
        updatedAt: now,
      });
      prisma.readingItem.upsert.mockResolvedValue({ id: 'ri-1' });
      prisma.readingSession.findFirst.mockResolvedValue(null);
      prisma.readingSession.create.mockResolvedValue({
        id: 'session-ebook-1',
        userId,
        bookId,
        readingItemId: 'ri-1',
        pagesRead: 6,
        sessionDate: new Date('2026-03-01T09:00:00.000Z'),
      });

      await service.updateEbookProgress(userId, bookId, {
        page: 16,
        sessionStartAt: '2026-03-01T09:00:00.000Z',
      });

      expect(prisma.readingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          bookId,
          readingItemId: 'ri-1',
          pagesRead: 6,
          sessionDate: new Date('2026-03-01T09:00:00.000Z'),
        }),
      });
    });

    it('does not create a reading session when ebook page does not advance', async () => {
      const now = new Date();
      prisma.book.findUnique.mockResolvedValue({
        id: bookId,
        title: 'Book A',
        isDigital: true,
        ebookFormat: 'EPUB',
        ebookFilePath: 'book-a.epub',
        totalPages: 300,
      });
      prisma.userBookAccess.findUnique.mockResolvedValue({
        id: 'access-1',
        userId,
        bookId,
      });
      prisma.ebookProgress.findUnique.mockResolvedValue({
        id: 'ep-1',
        userId,
        bookId,
        page: 20,
        locationCfi: 'cfi-20',
        percent: 6.66,
        createdAt: now,
        updatedAt: now,
      });
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        currentPage: 20,
      });
      prisma.ebookProgress.upsert.mockResolvedValue({
        id: 'ep-1',
        userId,
        bookId,
        page: 18,
        locationCfi: 'cfi-20',
        percent: 6,
        createdAt: now,
        updatedAt: now,
      });
      prisma.readingItem.upsert.mockResolvedValue({ id: 'ri-1' });

      await service.updateEbookProgress(userId, bookId, {
        page: 18,
        sessionStartAt: '2026-03-01T09:00:00.000Z',
      });

      expect(prisma.readingSession.create).not.toHaveBeenCalled();
    });

    it('updates existing session for the same reader-open timestamp', async () => {
      const now = new Date();
      prisma.book.findUnique.mockResolvedValue({
        id: bookId,
        title: 'Book A',
        isDigital: true,
        ebookFormat: 'EPUB',
        ebookFilePath: 'book-a.epub',
        totalPages: 300,
      });
      prisma.userBookAccess.findUnique.mockResolvedValue({
        id: 'access-1',
        userId,
        bookId,
      });
      prisma.ebookProgress.findUnique.mockResolvedValue({
        id: 'ep-1',
        userId,
        bookId,
        page: 16,
        locationCfi: 'cfi-16',
        percent: 5.33,
        createdAt: now,
        updatedAt: now,
      });
      prisma.readingItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        currentPage: 16,
      });
      prisma.ebookProgress.upsert.mockResolvedValue({
        id: 'ep-1',
        userId,
        bookId,
        page: 21,
        locationCfi: 'cfi-21',
        percent: 7,
        createdAt: now,
        updatedAt: now,
      });
      prisma.readingItem.upsert.mockResolvedValue({ id: 'ri-1' });
      prisma.readingSession.findFirst.mockResolvedValue({
        id: 'session-ebook-1',
        pagesRead: 6,
      });
      prisma.readingSession.update.mockResolvedValue({
        id: 'session-ebook-1',
        userId,
        bookId,
        readingItemId: 'ri-1',
        pagesRead: 11,
        sessionDate: new Date('2026-03-01T09:00:00.000Z'),
      });

      await service.updateEbookProgress(userId, bookId, {
        page: 21,
        sessionStartAt: '2026-03-01T09:00:00.000Z',
      });

      expect(prisma.readingSession.update).toHaveBeenCalledWith({
        where: { id: 'session-ebook-1' },
        data: { pagesRead: 11 },
      });
      expect(prisma.readingSession.create).not.toHaveBeenCalled();
    });
  });
});
