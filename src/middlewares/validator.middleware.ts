import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger, logFormat } from '../libs/winston.lib';
import { ApiResponse } from '../helpers/responseApi.helper';

interface ApiErrorDetail {
  field: string;
  message: string;
}

const handleZodError = (error: ZodError): ApiErrorDetail[] => {
  return error.errors.map((err) => ({
    field: err.path.join('.') || 'unknown',
    message: err.message
  }));
};

/**
 * Handle Zod error khusus untuk login dengan mengembalikan field asli
 */
const handleZodErrorLogin = (error: ZodError): ApiErrorDetail[] => {
  // Map untuk menyimpan error unik per field
  const fieldErrors = new Map<string, string>();
  
  error.errors.forEach((err) => {
    const field = err.path[0]?.toString() || 'unknown';
    
    // Khusus untuk strict object error (field tidak diizinkan)
    if (err.code === 'unrecognized_keys') {
      fieldErrors.set('request', err.message);
      return;
    }

    // Untuk field yang invalid_type dengan message "Required"
    if (err.code === 'invalid_type' && err.message === 'Required') {
      fieldErrors.set(field, `${field} wajib diisi`);
      return;
    }

    // Jika field sudah ada error, tidak perlu ditimpa
    if (!fieldErrors.has(field)) {
      fieldErrors.set(field, err.message);
    }
  });

  // Convert map ke array of ApiErrorDetail
  return Array.from(fieldErrors.entries()).map(([field, message]) => ({
    field,
    message
  }));
};

/**
 * Middleware validasi umum menggunakan Zod schema
 */
export const validate = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId || 'unknown';
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const validationErrors = handleZodError(result.error);
      
      // logger.error('Validation Error', {
      //   requestId,
      //   ...logFormat(req, {
      //     statusCode: 422,
      //     body: {
      //       message: 'Validation Error',
      //       details: validationErrors
      //     }
      //   })
      // });

      return ApiResponse.validationError(res, validationErrors);
    }

    logger.info('Validation Success', {
      requestId,
      ...logFormat(req, {
        statusCode: 200,
        body: result.data
      })
    });

    req.body = result.data;
    next();
  };
};

/**
 * Middleware validasi khusus untuk login
 */
export const validateLogin = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || 'unknown';
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const validationErrors = handleZodErrorLogin(result.error);
      
      logger.error('Login Validation Error', {
        requestId,
        ...logFormat(req, {
          statusCode: 422,
          body: {
            message: 'Validation Error',
            details: validationErrors
          }
        }),
        error: {
          originalErrors: result.error.errors
        }
      });

      return ApiResponse.validationError(res, validationErrors);
    }

    logger.info('Login Validation Success', {
      requestId,
      ...logFormat(req, {
        statusCode: 200,
        body: {
          user: result.data.user,
          timestamp: new Date().toISOString()
        }
      })
    });

    req.body = result.data;
    next();
  };
};