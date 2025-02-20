/*
 * File: starter.controller.ts
 * Project: starterexpress
 * File Created: Friday, 6th December 2024 9:02:18 am
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Thursday, 20th February 2025 10:52:10 am
 * Copyright 2017 - 2022 10RI Dev
 */
import { Request, Response } from 'express'
import { ApiResponse } from '../helpers/responseApi.helper';
import { logger } from '../utils/logger'
import Database from '../services/database.service'
import { QueryTypes } from 'sequelize'

// Model
import SystemHost from '../models/SystemHost.model';
import SystemHostdb2 from '../models/SystemHostDB2.model';

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
    // const modelSystemHostdb2 = await SystemHostdb2.findOne() || {}
    const modelSystemHost = await SystemHost.findOne() || {}
    
    const db = Database.getInstance()
    const initSamsatNew = await db.connect('samsatnew')
    const giro_polri = await initSamsatNew.query('select giro_polri from samsat.system_host', {
      type: QueryTypes.SELECT,
    });

    console.log("============giro_polri==========", giro_polri);

    const data = {
      ...modelSystemHost,
      giro_polri
    }
    // gabung data modelSystemHost dan giro_polri
   
    return ApiResponse.success(res, data);
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

export const systemHostdb2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelSystemHost = await SystemHostdb2.findOne()
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


export const systemHostSamsatnew = async (req: Request, res: Response): Promise<void> => {
  try {
    // const modelSystemHost = await SystemHostdb2.findOne()
    const db = Database.getInstance()
    const initSamsatNew = await db.connect('samsatnew')

    const query = await initSamsatNew.query('select * from samsat.system_host', {
      type: QueryTypes.SELECT,
    });
    console.log("============OK==========", query);
    return ApiResponse.success(res, query);
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
