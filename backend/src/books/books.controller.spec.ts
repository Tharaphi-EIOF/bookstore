import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { AuthService } from '../auth/auth.service';

describe('BooksController', () => {
  let controller: BooksController;
  let booksService: jest.Mocked<BooksService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            authenticateBearerToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    booksService = module.get(BooksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('exposes service methods for managed book actions', () => {
    expect(typeof booksService.create).toBe('function');
    expect(typeof booksService.update).toBe('function');
    expect(typeof booksService.remove).toBe('function');
  });
});
