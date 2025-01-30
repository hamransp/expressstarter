/*
 * File: responseApi.helper copy 2.ts
 * Project: starterexpress
 * File Created: Tuesday, 21st January 2025 3:30:06 pm
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Tuesday, 21st January 2025 3:30:06 pm
 * Copyright 2017 - 2022 10RI Dev
 */

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

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: ApiMetadata;
  requestId: string;
}

export class ApiResponse {
  private static getRequestId(res: Response): string {
    return res.req.requestId || 'unknown';
  }

  /**
   * Send a success response
   * @param res Express Response object
   * @param data Response data
   * @param httpCode HTTP status code (default: 200)
   * @param meta Optional metadata (pagination, etc)
   */
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
   * Send an error response
   * @param res Express Response object
   * @param httpCode HTTP status code
   * @param message Error message
   * @param details Optional error details
   */
  static error(
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

    logger.error('API Error Response', {
      requestId,
      ...logFormat(res.req, {
        statusCode: httpCode,
        body: { message, details }
      })
    });

    res.status(httpCode).json(errorResponse);
  }

  /**
   * Send a created response (201)
   * @param res Express Response object
   * @param data Created resource data
   * @param meta Optional metadata
   */
  static created<T>(
    res: Response,
    data: T,
    meta?: ApiMetadata
  ): void {
    this.success(res, data, 201, meta);
  }

  /**
   * Send a no content response (204)
   * @param res Express Response object
   */
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

  /**
   * Send a validation error response (422)
   * @param res Express Response object
   * @param details Validation error details
   */
  static validationError(
    res: Response,
    details: ApiErrorDetail[]
  ): void {
    this.error(res, 422, 'Validation Error', details);
  }

  /**
   * Send a not found error response (404)
   * @param res Express Response object
   * @param message Custom not found message
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): void {
    this.error(res, 404, message);
  }

  /**
   * Send an unauthorized error response (401)
   * @param res Express Response object
   * @param message Custom unauthorized message
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): void {
    this.error(res, 401, message);
  }

  /**
   * Send a forbidden error response (403)
   * @param res Express Response object
   * @param message Custom forbidden message
   */
  static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): void {
    this.error(res, 403, message);
  }
}