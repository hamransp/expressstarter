/*
 * File: httpClient.util.ts
 * Project: starterexpress
 * File Created: Tuesday, 11th February 2025 9:32:27 am
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Tuesday, 11th February 2025 9:56:25 am
 * Copyright 2017 - 2022 10RI Dev
 */

import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import { logger, logFormat, logFormatAxios } from '../libs/winston.lib'
import { ApiResponse } from '../helpers/responseApi.helper';
import dotenv from 'dotenv'
import { Console } from 'console'
import { Response } from 'express'
dotenv.config()

// Tentukan BASE_URL berdasarkan environment
const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? process.env.BASE_URL_DEV
    : process.env.BASE_URL_PROD

export const httpClient = async (
  res: Response,
  path: string,
  method: string,
  data?: any,
  headers: any = {},
  authToken?: string
): Promise<any> => {
  const url = `${BASE_URL}${path}`
  const config: AxiosRequestConfig = {
    url,
    method,
    headers: {
      ...headers,
      // ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    data,
    timeout: 10000, // Menambahkan opsi timeout, misalnya 10 detik
  }

  try {
    const response: AxiosResponse<any> = await axios(config)
    if (response.status >= 200 && response.status < 300) {
      logger.info('HTTPCLIENT :', logFormatAxios(config, response))
      return ApiResponse.success(response.data, response.status)
    } else {
      console.log('2', response)
      logger.info('HTTPCLIENT :', logFormatAxios(config, response))
      return ApiResponse.customError(res, response.status, response.statusText)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // console.log('1111111111111111111111111')
      if (error.response) {
        // console.log('2222222222222222222222222')
        const status = error.response.status
        const errorData = error.response.data
        const message =
          errorData?.data ??
          errorData?.message ??
          errorData?.error ??
          'Unknown error'
        logger.error('HTTPCLIENT isAxiosError :', logFormatAxios(config, error))

        // Jika status 400-499, anggap bukan error
        if (status >= 400 && status < 500) {
          // console.log('Error Data', errorData)
          if (errorData?.error === 'Unauthenticated.') {
            // ini perlakuan kalau tokennya tidak valid khusus request API ke middleware siskeudes kemendagri
            // return responseApi(401, 'invalid_token')
            return ApiResponse.customError(errorData, status, message)
          }

          // return responseApi(status, message)
          return ApiResponse.customError(errorData, status, message)
        }

        console.log('4444444444444444444444')
        // return responseApi(status, message)
        return ApiResponse.customError(errorData, status, message)
      } else if (error.request) {
        if (error.code === 'ECONNABORTED') {
          logger.error(
            'HTTPCLIENT ECONNABORTED :',
            logFormatAxios(config, error)
          )
          // return responseApi(408, 'Request timeout')
          return ApiResponse.customError(error.request, 408, 'Request timeout')
        } else {
          logger.error(
            'HTTPCLIENT ELSE ECONNABORTED :',
            logFormatAxios(config, error)
          )
          // return responseApi(500, 'Network error')
          return ApiResponse.error(error.request, new Error('Network error'))
        }
      } else {
        logger.error('HTTPCLIENT :', logFormatAxios(config, error))
        // return responseApi(500, `Request setup error API : ${error.message}`)
        return ApiResponse.error(error.request, new Error('Request setup error API Network error'))
      }
    } else {
      logger.error(
        'HTTPCLIENT NO isAxiosError :',
        logFormatAxios(config, error)
      )
      return ApiResponse.error(res, new Error('An unexpected error occurred API'))
    }
  }
}
