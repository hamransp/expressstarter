import { Response } from 'express';
import { logger, logFormat, logFormatAxios } from '../libs/winston.lib';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

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
    code: number;
    message: string;
    details?: ApiErrorDetail[];
    requestId: string;
}

interface ServerErrorResponse {
    code: number;
    message: string;
    requestId: string;
}

export interface ApiSuccessResponse<T> {
    code: number;
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

export class AxiosApiResponse {
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
        axiosConfig: AxiosRequestConfig,
        axiosRes: AxiosResponse,
        data: T,
        httpCode: number = 200,
        meta?: ApiMetadata
    ): ApiSuccessResponse<T> {
        const requestId = this.getRequestId(res);
        const response: ApiSuccessResponse<T> = {
            code: httpCode,
            data,
            requestId,
            ...(meta && { meta })
        };

        res.set({
            'X-Request-ID': requestId,
            'Cache-Control': 'no-cache',
        });

        // logger.info('Axios API Response', {
        //     requestId,
        //     ...logFormat(res.req, {
        //         statusCode: httpCode,
        //         body: data
        //     })
        // });
        logger.info('Axios API Response', {
            requestId,
            ...logFormatAxios(axiosConfig, axiosRes)
        });

        // res.status(httpCode).json(response);
        return response
    }

    /**
     * Handle non-500 errors (client errors like 400, 401, 403, 404, 422)
     */
    private static clientError(
        res: Response,
        axiosConfig: AxiosRequestConfig,
        axiosError: AxiosError,
        httpCode: number,
        message: string,
        details?: ApiErrorDetail[]
    ): ApiErrorResponse {
        const requestId = this.getRequestId(res);
        const errorResponse: ApiErrorResponse = {
            code: httpCode,
            message,
            requestId,
            ...(details && { details })
        };

        res.set({
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store',
        });

        logger.error('Axios API Client Error Response', {
            requestId,
            ...logFormatAxios(axiosConfig, {
                statusCode: httpCode,
                body: errorResponse,
                axiosError
            }),
        });

        // res.status(httpCode).json(errorResponse);
        return errorResponse
    }

    /**
     * Handle server errors (500)
     * Always returns standard "Internal Server Error" message to client
     * but logs detailed error information
     */
    static error(
        res: Response,
        axiosConfig: AxiosRequestConfig,
        error: ExtendedError
    ): ServerErrorResponse {
        const requestId = this.getRequestId(res);
        const errorResponse: ServerErrorResponse = {
            code: 500,
            message: 'Internal Server Error',
            requestId
        };

        res.set({
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store',
        });

        const logData = logFormatAxios(axiosConfig, {
            statusCode: 500,
            body: errorResponse
        });

        logger.error('Axios API Server Error Response', {
            requestId,
            ...logData,
            error: this.formatErrorForLog(error)
        });

        // res.status(500).json(errorResponse);
        return errorResponse
    }

    static created<T>(
        res: Response,
        axiosConfig: AxiosRequestConfig,
        axiosRes: AxiosResponse,
        data: T,
        meta?: ApiMetadata
    ): ApiSuccessResponse<T> {
        return this.success(res, axiosConfig, axiosRes, data, 201, meta);
    }

    static noContent(res: Response): void {
        const requestId = this.getRequestId(res);

        res.set({
            'X-Request-ID': requestId,
            'Cache-Control': 'no-cache',
        });

        logger.info('Axios API Response', {
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
        axiosConfig: AxiosRequestConfig,
        axiosError: AxiosError,
        details: ApiErrorDetail[]
    ): ApiErrorResponse {
        return this.clientError(res, axiosConfig, axiosError, 422, 'Validation Error', details);
    }

    static notFound(
        res: Response,
        axiosConfig: AxiosRequestConfig,
        axiosError: AxiosError,
        message: string = 'Resource not found'
    ): ApiErrorResponse {
        return this.clientError(res, axiosConfig, axiosError, 404, message);
    }

    static unauthorized(
        res: Response,
        axiosConfig: AxiosRequestConfig,
        axiosError: AxiosError,
        message: string = 'Unauthorized access'
    ): ApiErrorResponse {
        return this.clientError(res, axiosConfig, axiosError, 401, message);
    }

    static forbidden(
        res: Response,
        axiosConfig: AxiosRequestConfig,
        axiosError: AxiosError,
        message: string = 'Access forbidden'
    ): ApiErrorResponse {
        return this.clientError(res, axiosConfig, axiosError, 403, message);
    }


    static customError(
        res: Response,
        axiosConfig: AxiosRequestConfig,
        axiosError: AxiosError,
        code: number,
        message: string = 'Error'
    ): ApiErrorResponse {
        return this.clientError(res, axiosConfig, axiosError, code, message);
    }
}