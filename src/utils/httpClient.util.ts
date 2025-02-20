/*
 * File: httpClient.util.ts
 * Project: starterexpress
 * File Created: Tuesday, 11th February 2025 9:32:27 am
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Thursday, 20th February 2025 9:56:12 am
 * Copyright 2017 - 2022 10RI Dev
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { AxiosApiResponse } from '../helpers/axiosResponseApi.helper'
import dotenv from 'dotenv'
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
            return AxiosApiResponse.success(res, config, response, response.data, response.status)
        } else {
            return AxiosApiResponse.success(res, config, response, response.data, response.status)
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                const errorData = error.response.data
                // console.log('2222222222222222222222222', errorData)
                const status = parseInt(errorData?.code ?? error.response.status.toString ?? '400')
                const message =
                    errorData?.message ??
                    errorData?.data ??
                    errorData?.error ??
                    'Unknown error'

                if (status >= 400 && status < 500) {
                    if (errorData?.error === 'Unauthenticated.') {
                        return AxiosApiResponse.customError(res, config, error, status, message)
                    }

                    return AxiosApiResponse.customError(res, config, error, status, message)
                }

                return AxiosApiResponse.customError(res, config, error, status, message)
            } else if (error.request) {
                if (error.code === 'ECONNABORTED') {
                    return AxiosApiResponse.customError(res, config, error, 408, 'Request timeout')
                } else {
                    return AxiosApiResponse.error(res, config, new Error('Network error'))
                }
            } else {
                return AxiosApiResponse.error(res, config, new Error('Request setup error API Network error'))
            }
        } else {
            return AxiosApiResponse.error(res, config, new Error('An unexpected error occurred API'))
        }
    }
}
