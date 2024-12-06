/*
 * File: winston.lib.ts
 * File Created: Monday, 3rd June 2024 3:38:59 pm
 * Url: https://arungpalakka.com
 * Author: Rede (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from 'dotenv'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

// import ecsFormat from '@elastic/ecs-winston-format'
config()

const myFormatter = winston.format((info) => {
  info.appTimestamp = new Date().toString()
  return info
})()

// export const logger = winston.createLogger({
//   // format: ecsFormat(),
//   format: winston.format.combine(myFormatter, winston.format.json()),
//   transports: [
//     // new winston.transports.Console(),
//     new DailyRotateFile({
//       datePattern: 'YYYY-MM-DD',
//       dirname: process.env.LOG_DIRECTORY,
//       level: 'error',
//       filename: 'error-%DATE%.log',
//       // zippedArchive: true,
//       maxSize: '1m',
//       handleExceptions: process.env.LOG_EXCEPTIONS ? true : false,
//       handleRejections: process.env.LOG_REJECTIONS ? true : false,
//     }),
//     new DailyRotateFile({
//       datePattern: 'YYYY-MM-DD',
//       dirname: process.env.LOG_DIRECTORY,
//       level: 'silly',
//       filename: '%DATE%.log',
//       // zippedArchive: true,
//       maxSize: '1m',
//     }),
//   ],
// })

const errorLogger = winston.createLogger({
  format: winston.format.combine(myFormatter, winston.format.json()),
  transports: [
    new DailyRotateFile({
      datePattern: 'YYYY-MM-DD',
      dirname: process.env.LOG_DIRECTORY,
      level: 'error',
      filename: 'error-%DATE%.log',
      maxSize: '1m',
      handleExceptions: process.env.LOG_EXCEPTIONS ? true : false,
      handleRejections: process.env.LOG_REJECTIONS ? true : false,
    }),
  ],
})

const infoLogger = winston.createLogger({
  format: winston.format.combine(myFormatter, winston.format.json()),
  transports: [
    new DailyRotateFile({
      datePattern: 'YYYY-MM-DD',
      dirname: process.env.LOG_DIRECTORY,
      level: 'silly',
      filename: '%DATE%.log',
      maxSize: '1m',
    }),
  ],
})

export const logger = {
  error: (message: string, meta?: any) => errorLogger.error(message, meta),
  warn: (message: string, meta?: any) => infoLogger.warn(message, meta),
  info: (message: string, meta?: any) => infoLogger.info(message, meta),
  verbose: (message: string, meta?: any) => infoLogger.verbose(message, meta),
  debug: (message: string, meta?: any) => infoLogger.debug(message, meta),
  silly: (message: string, meta?: any) => infoLogger.silly(message, meta),
}

// export const logFormat = (req: any, res: any) => {
//   const data = res.data ? JSON.stringify(res.data).substring(0, 200) : ''

//   return {
//     data: {
//       request: {
//         method: req.method,
//         headers: req.headers,
//         body: req.body,
//       },
//       response: {
//         code: res.code,
//         message: res.message,
//         data: data,
//       },
//     },
//     url: {
//       path: req.originalUrl,
//       domain: req.get('host'),
//       full: req.protocol + '://' + req.get('host') + req.originalUrl,
//     },
//     client: {
//       ip: req.header('x-forwarded-for') || req.socket.remoteAddress,
//       address: req.socket.remoteAddress,
//       port: req.socket.remotePort,
//     },
//   }
// }
export const logFormat = (clientRequest: any, clientResponse: any) => {
  return {
    client: {
      request: {
        method: clientRequest.method,
        headers: clientRequest.headers,
        body: clientRequest.body,
        url: {
          path: clientRequest.originalUrl,
          domain: clientRequest.get('host'),
          full:
            clientRequest.protocol +
            '://' +
            clientRequest.get('host') +
            clientRequest.originalUrl,
        },
        client: {
          ip:
            clientRequest.header('x-forwarded-for') ||
            clientRequest.socket.remoteAddress,
          address: clientRequest.socket.remoteAddress,
          port: clientRequest.socket.remotePort,
        },
      },
      response: clientResponse,
    },
  }
}

export const logFormatValidation = (
  clientRequest: any,
  clientResponse: any
) => {
  return {
    client: {
      request: {
        method: clientRequest.method,
        headers: clientRequest.headers,
        body: clientRequest.body,
        url: {
          path: clientRequest.originalUrl,
          domain: clientRequest.get('host'),
          full:
            clientRequest.protocol +
            '://' +
            clientRequest.get('host') +
            clientRequest.originalUrl,
        },
        client: {
          ip:
            clientRequest.header('x-forwarded-for') ||
            clientRequest.socket.remoteAddress,
          address: clientRequest.socket.remoteAddress,
          port: clientRequest.socket.remotePort,
        },
      },
      response: clientResponse,
    },
  }
}

// function log format untuk
export const logFormatAxios = (
  config: AxiosRequestConfig,
  response: AxiosResponse | any
) => {
  return {
    request: {
      method: config.method,
      headers: config.headers,
      body: config.data,
      url: {
        path: config.url,
        full: `${config.method?.toUpperCase()} ${config.url}`,
      },
    },
    response: {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    },
    error: response.isAxiosError
      ? {
          message: response.message,
          code: response.code,
          stack: response.stack,
        }
      : undefined,
  }
}
