import { Response } from 'express';
import { logger, logFormat } from '../libs/winston.lib';

interface ApiErrorDetail {
  field?: string;
  message: string;
}

interface ApiMetadata {
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  [key: string]: any;
}

interface ApiErrorResponse {
  message: string;
  details?: ApiErrorDetail[];
  requestId: string;
}

interface ServerErrorResponse {
  message: string;
  requestId: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: ApiMetadata;
  requestId: string;
}

interface ExtendedError extends Error {
  [key: string]: any;
  sqlMessage?: string;
  sql?: string;
  code?: string | number;
  type?: string;
  details?: any;
}

export class ApiResponse {
  private static getRequestId(res: Response): string {
    return res.req.requestId || 'unknown';
  }

  private static formatErrorForLog(error: ExtendedError) {
    const { message, stack, name, ...rest } = error;
    return {
      type: rest.type || name,
      message,
      stack,
      details: {
        ...rest,
        sqlMessage: rest.sqlMessage,
        sql: rest.sql,
        code: rest.code
      }
    };
  }

  static success<T>(
    res: Response,
    data: T,
    httpCode: number = 200,
    meta?: ApiMetadata
  ): void {
    const requestId = this.getRequestId(res);
    const response: ApiSuccessResponse<T> = {
      data,
      requestId,
      ...(meta && { meta })
    };

    res.set({
      'X-Request-ID': requestId,
      'Cache-Control': 'no-cache',
    });

    logger.info('API Response', {
      requestId,
      ...logFormat(res.req, {
        statusCode: httpCode,
        body: data
      })
    });

    res.status(httpCode).json(response);
  }

  /**
   * Handle non-500 errors (client errors like 400, 401, 403, 404, 422)
   */
  private static clientError(
    res: Response,
    httpCode: number,
    message: string,
    details?: ApiErrorDetail[]
  ): void {
    const requestId = this.getRequestId(res);
    const errorResponse: ApiErrorResponse = {
      message,
      requestId,
      ...(details && { details })
    };

    res.set({
      'X-Request-ID': requestId,
      'Cache-Control': 'no-store',
    });

    logger.error('API Client Error Response', {
      requestId,
      ...logFormat(res.req, {
        statusCode: httpCode,
        body: errorResponse
      })
    });

    res.status(httpCode).json(errorResponse);
  }

  /**
   * Handle server errors (500)
   * Always returns standard "Internal Server Error" message to client
   * but logs detailed error information
   */
  static error(
    res: Response,
    error: ExtendedError
  ): void {
    const requestId = this.getRequestId(res);
    const errorResponse: ServerErrorResponse = {
      message: 'Internal Server Error',
      requestId
    };

    res.set({
      'X-Request-ID': requestId,
      'Cache-Control': 'no-store',
    });

    const logData = logFormat(res.req, {
      statusCode: 500,
      body: errorResponse
    });

    logger.error('API Server Error Response', {
      requestId,
      ...logData,
      error: this.formatErrorForLog(error)
    });

    res.status(500).json(errorResponse);
  }

  static created<T>(
    res: Response,
    data: T,
    meta?: ApiMetadata
  ): void {
    this.success(res, data, 201, meta);
  }

  static noContent(res: Response): void {
    const requestId = this.getRequestId(res);
    
    res.set({
      'X-Request-ID': requestId,
      'Cache-Control': 'no-cache',
    });

    logger.info('API Response', {
      requestId,
      ...logFormat(res.req, {
        statusCode: 204,
        body: null
      })
    });

    res.status(204).send();
  }

  static validationError(
    res: Response,
    details: ApiErrorDetail[]
  ): void {
    this.clientError(res, 422, 'Validation Error', details);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): void {
    this.clientError(res, 404, message);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): void {
    this.clientError(res, 401, message);
  }

  static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): void {
    this.clientError(res, 403, message);
  }

  static customError(
    res: Response,
    code: number,
    message: string = 'Error'
  ): void {
    this.clientError(res, code, message);
  }
}