/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AllExceptionsFilter } from './all-exceptions.filter';
import * as fc from 'fast-check';

type ResponseMock = Pick<Response, 'status' | 'json'> & {
  status: jest.Mock;
  json: jest.Mock;
};

type RequestMock = Pick<Request, 'url' | 'method'>;

type HttpArgumentsHostMock = {
  getResponse: () => ResponseMock;
  getRequest: () => RequestMock;
};

type FilterWithLogger = AllExceptionsFilter & {
  logger: Pick<Logger, 'error' | 'warn'>;
};

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: ResponseMock;
  let mockRequest: RequestMock;
  let mockArgumentsHost: ArgumentsHost;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    loggerErrorSpy = jest
      .spyOn((filter as FilterWithLogger).logger, 'error')
      .mockImplementation();
    loggerWarnSpy = jest
      .spyOn((filter as FilterWithLogger).logger, 'warn')
      .mockImplementation();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test',
      method: 'GET',
    };

    const httpHost: HttpArgumentsHostMock = {
      getResponse: () => mockResponse,
      getRequest: () => mockRequest,
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: httpHost.getResponse,
        getRequest: httpHost.getRequest,
      }),
    } as unknown as ArgumentsHost;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('Unit Tests', () => {
    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Validation failed', error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        error: 'Bad Request',
        message: 'Validation failed',
      });
      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        error: 'HttpException',
        message: 'Not found',
      });
    });

    it('should handle non-HTTP exceptions', () => {
      const exception = new Error('Database connection failed');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        error: 'InternalServerError',
        message: 'Internal server error',
      });
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle validation errors with array messages', () => {
      const exception = new HttpException(
        {
          message: ['field1 is required', 'field2 must be a string'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        error: 'Bad Request',
        message: ['field1 is required', 'field2 must be a string'],
      });
    });

    it('should include request method and path in error response', () => {
      mockRequest.url = '/api/books/123';
      mockRequest.method = 'POST';

      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/books/123',
          method: 'POST',
        }),
      );
    });
  });

  describe('Property Tests', () => {
    /**
     * **Property 30: Invalid input returns 400 error**
     * **Validates: Requirements 7.1, 7.6**
     */
    it('Property 30: Invalid input returns 400 error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            path: fc.string({ minLength: 1 }),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
            message: fc.oneof(
              fc.string({ minLength: 1 }),
              fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
            ),
          }),
          (testData) => {
            mockRequest.url = testData.path;
            mockRequest.method = testData.method;

            const exception = new HttpException(
              { message: testData.message, error: 'Bad Request' },
              HttpStatus.BAD_REQUEST,
            );

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
              statusCode: 400,
              timestamp: expect.any(String),
              path: testData.path,
              method: testData.method,
              error: 'Bad Request',
              message: testData.message,
            });
          },
        ),
        { numRuns: 20 },
      );
    });

    /**
     * **Property 31: Missing resource returns 404 error**
     * **Validates: Requirements 7.2**
     */
    it('Property 31: Missing resource returns 404 error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            path: fc.string({ minLength: 1 }),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
            resourceType: fc.constantFrom('Book', 'User', 'Order', 'Cart'),
          }),
          (testData) => {
            mockRequest.url = testData.path;
            mockRequest.method = testData.method;

            const message = `${testData.resourceType} not found`;
            const exception = new HttpException(message, HttpStatus.NOT_FOUND);

            filter.catch(exception, mockArgumentsHost);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
              statusCode: 404,
              timestamp: expect.any(String),
              path: testData.path,
              method: testData.method,
              error: 'HttpException',
              message: message,
            });
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
