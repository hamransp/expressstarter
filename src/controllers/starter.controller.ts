/*
 * File: starter.controller.ts
 * Project: starterexpress
 * File Created: Friday, 6th December 2024 9:02:18 am
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Thursday, 30th January 2025 1:23:41 pm
 * Copyright 2017 - 2022 10RI Dev
 */
import { Request, Response } from 'express'
import { ApiResponse } from '../helpers/responseApi.helper';
import { logger } from '../utils/logger'


// Model
import SystemHostDB2 from '../models/SystemHostDB2.model';

export const starter = async (req: Request, res: Response): Promise<void> => {
    try {
      // return ApiResponse.notFound(res, 'tidak ditemukan' )
      return ApiResponse.success(res, "datanya");
      // return ApiResponse.created(res, "created");
      // return ApiResponse.noContent(res);
      // return ApiResponse.error(res, new Error('Ini error hanya muncul di server'));
    } catch (error) {
      if (error instanceof Error && error.name === 'EmailValidationError') {
        return ApiResponse.validationError(res, [
          { field: 'inputan', message: error.message }
        ]);
      }
      logger.error('Error in starter controller:', error)
      return ApiResponse.error(res, new Error('Unknown error occurred'));
    }
}
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
      // return ApiResponse.notFound(res, 'tidak ditemukan' )
      return ApiResponse.success(res, "datanya");
      // return ApiResponse.created(res, "created");
      // return ApiResponse.noContent(res);
      // return ApiResponse.error(res, new Error('Ini error hanya muncul di server'));
    } catch (error) {
      if (error instanceof Error && error.name === 'EmailValidationError') {
        return ApiResponse.validationError(res, [
          { field: 'inputan', message: error.message }
        ]);
      }
      logger.error('Error in starter controller:', error)
      return ApiResponse.error(res, new Error('Unknown error occurred'));
    }
}
export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      // return ApiResponse.notFound(res, 'tidak ditemukan' )
      return ApiResponse.success(res, "datanya");
      // return ApiResponse.created(res, "created");
      // return ApiResponse.noContent(res);
      // return ApiResponse.error(res, new Error('Ini error hanya muncul di server'));
    } catch (error) {
      if (error instanceof Error && error.name === 'EmailValidationError') {
        return ApiResponse.validationError(res, [
          { field: 'inputan', message: error.message }
        ]);
      }
      logger.error('Error in starter controller:', error)
      return ApiResponse.error(res, new Error('Unknown error occurred'));
    }
}
export const systemHost = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelSystemHost = await SystemHostDB2.findOne()
    return ApiResponse.success(res, modelSystemHost);
  } catch (error) {
    if (error instanceof Error && error.name === 'EmailValidationError') {
      return ApiResponse.validationError(res, [
        { field: 'inputan', message: error.message }
      ]);
    }
    logger.error('Error in starter controller:', error)
    return ApiResponse.error(res, new Error('Unknown error occurred'));
  }
}

