/*
 * File: starter.controller.ts
 * Project: starterexpress
 * File Created: Friday, 6th December 2024 9:02:18 am
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Friday, 6th December 2024 9:05:59 am
 * Copyright 2017 - 2022 10RI Dev
 */
import { Request, Response } from 'express'
import { responseApi } from '../helpers/responseApi.helper'
import { logger } from '../utils/logger'

export const starter = async (req: Request, res: Response): Promise<void> => {
    try {
      res
        .status(200)
        .json(responseApi(200, 'Starter Controller is working fine'))
    } catch (error) {
      if (error instanceof Error && error.name === 'EmailValidationError') {
        res.status(400).json(responseApi(400, error.message))
        return
      }
      logger.error('Error in starter controller:', error)
      res.status(500).json(responseApi(500, 'Internal server error'))
    }
  }
  