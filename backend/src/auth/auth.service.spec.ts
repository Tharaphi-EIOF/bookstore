import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { resolveUserPermissionKeys } from './permission-resolution';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('./permission-resolution', () => ({
  resolveUserPermissionKeys: jest.fn().mockResolvedValue(new Set<string>()),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userFindUniqueMock: jest.Mock;
  let userCreateMock: jest.Mock;
  let signAsyncMock: jest.Mock;
  let hashMock: jest.MockedFunction<typeof bcrypt.hash>;
  let compareMock: jest.MockedFunction<typeof bcrypt.compare>;

  const createConfigServiceMock = () => ({
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const config = new Map<string, unknown>([
        ['BCRYPT_ROUNDS', 10],
        ['JWT_SECRET', 'test-secret'],
        ['JWT_EXPIRES_IN', '24h'],
      ]);

      return config.get(key) ?? defaultValue;
    }),
  });

  const getFirstCreateUserArgs = () => {
    const createUserCalls = userCreateMock.mock.calls as Array<
      [
        {
          data: {
            email: string;
            name: string;
            password: string;
          };
        },
      ]
    >;

    return createUserCalls[0]?.[0];
  };

  beforeEach(async () => {
    userFindUniqueMock = jest.fn();
    userCreateMock = jest.fn();
    signAsyncMock = jest.fn();
    hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
    compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
    hashMock.mockResolvedValue('$2b$10$defaultHashedPassword');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: userFindUniqueMock,
              create: userCreateMock,
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: signAsyncMock,
          },
        },
        {
          provide: ConfigService,
          useValue: createConfigServiceMock(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    const mockedResolvePermissions =
      resolveUserPermissionKeys as jest.MockedFunction<
        typeof resolveUserPermissionKeys
      >;
    mockedResolvePermissions.mockResolvedValue(new Set<string>());

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Property Tests', () => {
    /**
     * **Property 1: User registration creates account**
     * **Validates: Requirements 1.1**
     */
    it('Property 1: User registration creates account', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (userData: RegisterDto) => {
            // Arrange: Mock that user doesn't exist and creation succeeds
            const mockUser = {
              id: 'test-id',
              email: userData.email,
              name: userData.name,
              role: 'USER' as const,
              createdAt: new Date(),
            };

            userFindUniqueMock.mockResolvedValue(null);
            userCreateMock.mockResolvedValue(mockUser);

            // Act: Register user
            const result = await service.register(userData);
            const createUserArgs = getFirstCreateUserArgs();

            // Assert: User account is created
            expect(userFindUniqueMock).toHaveBeenCalledWith({
              where: { email: userData.email },
            });
            expect(createUserArgs).toBeDefined();
            expect(createUserArgs?.data.email).toEqual(expect.any(String));
            expect(createUserArgs?.data.name).toEqual(expect.any(String));
            expect(createUserArgs?.data.password).toEqual(expect.any(String));
            expect(result).toEqual(mockUser);
            expect(result).not.toHaveProperty('password');
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 2: Valid login returns JWT token**
     * **Validates: Requirements 1.2**
     */
    it('Property 2: Valid login returns JWT token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (loginData) => {
            // Arrange: Mock existing user with hashed password
            const hashedPassword = '$2b$10$mockHashedPassword';
            const mockUser = {
              id: 'test-user-id',
              email: loginData.email,
              name: 'Test User',
              password: hashedPassword,
              role: 'USER' as const,
              isActive: true,
              avatarType: null,
              avatarValue: null,
              backgroundColor: null,
              pronouns: null,
              shortBio: null,
              about: null,
              coverImage: null,
              staffProfile: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const mockToken = 'mock-jwt-token';

            userFindUniqueMock.mockResolvedValue(mockUser);
            signAsyncMock.mockResolvedValue(mockToken);

            // Mock bcrypt.compare to return true for valid password
            compareMock.mockResolvedValue(true);

            // Act: Login user
            const result = await service.login(loginData);

            // Assert: JWT token is returned
            expect(userFindUniqueMock).toHaveBeenCalledWith(
              expect.objectContaining({
                where: { email: loginData.email },
              }),
            );
            expect(compareMock).toHaveBeenCalledWith(
              loginData.password,
              hashedPassword,
            );
            expect(signAsyncMock).toHaveBeenCalledWith(
              expect.objectContaining({
                sub: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
                permissions: [],
              }),
            );
            expect(result).toEqual({
              access_token: mockToken,
            });
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 3: Invalid password rejects login**
     * **Validates: Requirements 1.3**
     */
    it('Property 3: Invalid password rejects login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (loginData) => {
            // Arrange: Mock existing user with different hashed password
            const hashedPassword = '$2b$10$differentHashedPassword';
            const mockUser = {
              id: 'test-user-id',
              email: loginData.email,
              name: 'Test User',
              password: hashedPassword,
              role: 'USER' as const,
              avatarType: null,
              avatarValue: null,
              backgroundColor: null,
              pronouns: null,
              shortBio: null,
              about: null,
              coverImage: null,
              staffProfile: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            userFindUniqueMock.mockResolvedValue(mockUser);

            // Mock bcrypt.compare to return false for invalid password
            compareMock.mockResolvedValue(false);

            // Act & Assert: Login should be rejected
            await expect(service.login(loginData)).rejects.toThrow(
              'Incorrect password',
            );

            expect(userFindUniqueMock).toHaveBeenCalledWith(
              expect.objectContaining({
                where: { email: loginData.email },
              }),
            );
            expect(compareMock).toHaveBeenCalledWith(
              loginData.password,
              hashedPassword,
            );
            expect(signAsyncMock).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 5: Passwords are hashed**
     * **Validates: Requirements 1.5**
     */
    it('Property 5: Passwords are hashed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (userData: RegisterDto) => {
            // Arrange: Mock that user doesn't exist
            const mockUser = {
              id: 'test-id',
              email: userData.email,
              name: userData.name,
              role: 'USER' as const,
              createdAt: new Date(),
            };

            userFindUniqueMock.mockResolvedValue(null);
            userCreateMock.mockResolvedValue(mockUser);

            // Spy on bcrypt.hash to verify it's called
            hashMock.mockResolvedValue('$2b$10$hashedPassword');

            // Act: Register user
            await service.register(userData);
            const createUserArgs = getFirstCreateUserArgs();

            // Assert: Password is hashed before storage
            expect(hashMock).toHaveBeenCalledWith(userData.password, 10);
            expect(createUserArgs).toBeDefined();
            expect(createUserArgs?.data.email).toEqual(expect.any(String));
            expect(createUserArgs?.data.name).toEqual(expect.any(String));
            expect(createUserArgs?.data.password).toBe('$2b$10$hashedPassword');

            // Verify the password passed to create is not the original password
            expect(createUserArgs?.data.password).not.toBe(userData.password);
            expect(createUserArgs?.data.password).toMatch(/^\$2b\$10\$/); // bcrypt hash format
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);

    /**
     * **Property 6: Duplicate email registration rejected**
     * **Validates: Requirements 1.6**
     */
    it('Property 6: Duplicate email registration rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 6, maxLength: 100 }),
          }),
          async (userData: RegisterDto) => {
            // Arrange: Mock that user already exists with this email
            const existingUser = {
              id: 'existing-user-id',
              email: userData.email,
              name: 'Existing User',
              password: '$2b$10$existingHashedPassword',
              role: 'USER' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            userFindUniqueMock.mockResolvedValue(existingUser);

            // Act & Assert: Registration should be rejected
            await expect(service.register(userData)).rejects.toThrow(
              'Email already registered',
            );

            expect(userFindUniqueMock).toHaveBeenCalledWith({
              where: { email: userData.email },
            });
            expect(userCreateMock).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 20 },
      );
    }, 10000);
  });

  describe('Unit Tests', () => {
    describe('register', () => {
      it('should register a user with valid data', async () => {
        // Arrange
        const registerDto: RegisterDto = {
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        };

        const mockUser = {
          id: 'test-id',
          email: registerDto.email,
          name: registerDto.name,
          role: 'USER' as const,
          createdAt: new Date(),
        };

        userFindUniqueMock.mockResolvedValue(null);
        userCreateMock.mockResolvedValue(mockUser);

        // Act
        const result = await service.register(registerDto);
        const createUserArgs = getFirstCreateUserArgs();

        // Assert
        expect(result).toEqual(mockUser);
        expect(userFindUniqueMock).toHaveBeenCalledWith({
          where: { email: registerDto.email },
        });
        expect(createUserArgs).toBeDefined();
        expect(createUserArgs?.data.email).toBe(registerDto.email);
        expect(createUserArgs?.data.name).toBe(registerDto.name);
        expect(createUserArgs?.data.password).toEqual(expect.any(String));
      });

      it('should throw BadRequestException for duplicate email', async () => {
        // Arrange
        const registerDto: RegisterDto = {
          email: 'existing@example.com',
          name: 'Test User',
          password: 'password123',
        };

        const existingUser = {
          id: 'existing-id',
          email: registerDto.email,
          name: 'Existing User',
          password: 'hashedPassword',
          role: 'USER' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        userFindUniqueMock.mockResolvedValue(existingUser);

        // Act & Assert
        await expect(service.register(registerDto)).rejects.toThrow(
          'Email already registered',
        );
        expect(userCreateMock).not.toHaveBeenCalled();
      });
    });

    describe('login', () => {
      it('should login with valid credentials', async () => {
        // Arrange
        const loginDto = {
          email: 'test@example.com',
          password: 'password123',
        };

        const mockUser = {
          id: 'test-id',
          email: loginDto.email,
          name: 'Test User',
          password: '$2b$10$hashedPassword',
          role: 'USER' as const,
          isActive: true,
          avatarType: null,
          avatarValue: null,
          backgroundColor: null,
          pronouns: null,
          shortBio: null,
          about: null,
          coverImage: null,
          staffProfile: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockToken = 'mock-jwt-token';

        userFindUniqueMock.mockResolvedValue(mockUser);
        signAsyncMock.mockResolvedValue(mockToken);

        compareMock.mockResolvedValue(true);

        // Act
        const result = await service.login(loginDto);

        // Assert
        expect(result).toEqual({ access_token: mockToken });
        expect(userFindUniqueMock).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { email: loginDto.email },
          }),
        );
        expect(signAsyncMock).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
            permissions: [],
          }),
        );
      });

      it('should throw UnauthorizedException for non-existent user', async () => {
        // Arrange
        const loginDto = {
          email: 'nonexistent@example.com',
          password: 'password123',
        };

        userFindUniqueMock.mockResolvedValue(null);

        // Act & Assert
        await expect(service.login(loginDto)).rejects.toThrow(
          'No account found with this email address',
        );
        expect(signAsyncMock).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException for invalid password', async () => {
        // Arrange
        const loginDto = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        const mockUser = {
          id: 'test-id',
          email: loginDto.email,
          name: 'Test User',
          password: '$2b$10$hashedPassword',
          role: 'USER' as const,
          isActive: true,
          avatarType: null,
          avatarValue: null,
          backgroundColor: null,
          pronouns: null,
          shortBio: null,
          about: null,
          coverImage: null,
          staffProfile: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        userFindUniqueMock.mockResolvedValue(mockUser);

        compareMock.mockResolvedValue(false);

        // Act & Assert
        await expect(service.login(loginDto)).rejects.toThrow(
          'Incorrect password',
        );
        expect(signAsyncMock).not.toHaveBeenCalled();
      });
    });
  });
});
