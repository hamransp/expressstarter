import winston from 'winston'
import Transport from 'winston-transport'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from 'dotenv'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

config()
const withRetry = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return withRetry(fn, retries - 1)
    }
    throw error
  }
}

class LogstashTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts)
  }

  private async sendToLogstash(info: any) {
    const logData = {
      ...info,
      prod_id: process.env.LOGSTASH_PROD_ID || 'unknown',
      timestamp: new Date().toISOString()
    }

    try {
      await withRetry(async () => {
        await axios.post(process.env.LOGSTASH_URL as string, logData, {
          headers: { 'Content-Type': 'application/json' }
        })
      })
    } catch (error) {
      console.error('Failed to send logs to Logstash after 3 retries:', error)
    }
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.sendToLogstash(info)
    })
    callback()
  }
}

const myFormatter = winston.format((info) => {
  info.appTimestamp = new Date().toString()
  return info
})()

// Get file transport configuration
const getFileTransport = (isError: boolean = false) => {
  return new DailyRotateFile({
    datePattern: 'YYYY-MM-DD',
    dirname: process.env.LOG_DIRECTORY,
    level: isError ? 'error' : 'silly',
    filename: isError ? 'error-%DATE%.log' : '%DATE%.log',
    maxSize: '1m',
    handleExceptions: isError && process.env.LOG_EXCEPTIONS ? true : false,
    handleRejections: isError && process.env.LOG_REJECTIONS ? true : false,
  })
}

// Determine which transports to use based on LOGSTASH_ENABLED
const getTransports = (isError: boolean = false): Transport[] => {
  const transports: Transport[] = [getFileTransport(isError)]

  if (process.env.LOGSTASH_ENABLED === 'TRUE') {
    transports.push(new LogstashTransport({ 
      level: isError ? 'error' : 'info',
    }))
  }

  return transports
}


const errorLogger = winston.createLogger({
  format: winston.format.combine(myFormatter, winston.format.json()),
  transports: getTransports(true),
})

const infoLogger = winston.createLogger({
  format: winston.format.combine(myFormatter, winston.format.json()),
  transports: getTransports(false),
})

export const logger = {
  error: (message: string, meta?: any) => errorLogger.error(message, meta),
  warn: (message: string, meta?: any) => infoLogger.warn(message, meta),
  info: (message: string, meta?: any) => infoLogger.info(message, meta),
  verbose: (message: string, meta?: any) => infoLogger.verbose(message, meta),
  debug: (message: string, meta?: any) => infoLogger.debug(message, meta),
  silly: (message: string, meta?: any) => infoLogger.silly(message, meta),
}

// Existing logFormat functions remain unchanged
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


export const logFormatValidation = logFormat
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