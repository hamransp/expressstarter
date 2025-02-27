import winston from 'winston'
import Transport from 'winston-transport'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from 'dotenv'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

config()

// Extend Winston's TransformableInfo type
interface LogInfo extends winston.Logform.TransformableInfo {
  requestId?: string;
  request?: {
    method?: string;
    path?: string;
    body?: any;
    url?: {
      path?: string;
    };
    client?: {
      ip?: string;
      port?: number;
    };
  };
  response?: {
    statusCode?: number;
    message?: string;
    body?: any;
  };
  [key: string]: any;
}

export interface LogResponse {
  statusCode?: number;
  message?: string;
  body?: any;
}

interface LogRequest {
  method?: string;
  path?: string;
  body?: any;
  originalUrl?: string;
  header?: (name: string) => string | undefined;
  socket?: {
    remoteAddress?: string;
    remotePort?: number;
  };
  get?: (name: string) => string | undefined;
}

class LogstashTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts)
  }

  private async sendToLogstash(info: LogInfo) {
    const logData = {
      requestId: info.requestId || 'unknown',
      prod_id: process.env.LOGSTASH_PROD_ID || 'unknown',
      timestamp: new Date().toISOString(),
      ...info
    }

    try {
      await axios.post(process.env.LOGSTASH_URL as string, logData, {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Failed to send logs to Logstash:', error)
    }
  }

  log(info: LogInfo, callback: () => void) {
    setImmediate(() => {
      this.sendToLogstash(info)
    })
    callback()
  }
}

// Format timestamp
const timestampFormat = winston.format((info: LogInfo) => {
  info.timestamp = new Date().toISOString();
  return info;
});

// Reorder fields and clean up format
const reorderFormat = winston.format((info: LogInfo) => {
  const { timestamp, level, message, requestId, ...rest } = info;
  const { response, request, ...otherRest } = rest;
  
  const cleanResponse = response ? {
    statusCode: response.statusCode,
    body: response.body,
    message: response.message
  } : undefined;

  return {
    requestId: requestId || 'unknown',
    timestamp,
    level,
    message,
    ...otherRest,
    request: request ? {
      method: request.method,
      path: request.url?.path,
      body: request.body,
      client: request.client
    } : undefined,
    response: cleanResponse
  };
});

// Get file transport configuration
const getFileTransport = (isError: boolean = false) => {
  return new DailyRotateFile({
    datePattern: 'YYYY-MM-DD',
    dirname: process.env.LOG_DIRECTORY || 'logs',
    level: isError ? 'error' : 'silly',
    filename: isError ? 'error-%DATE%.log' : '%DATE%.log',
    maxSize: '1m',
    handleExceptions: isError && process.env.LOG_EXCEPTIONS === 'true',
    handleRejections: isError && process.env.LOG_REJECTIONS === 'true',
  })
}

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
  format: winston.format.combine(
    timestampFormat(),
    reorderFormat(),
    winston.format.json()
  ),
  transports: getTransports(true),
})

const infoLogger = winston.createLogger({
  format: winston.format.combine(
    timestampFormat(),
    reorderFormat(),
    winston.format.json()
  ),
  transports: getTransports(false),
})

export const logger = {
  error: (message: string, meta?: any) => errorLogger.error({ message, ...meta }),
  warn: (message: string, meta?: any) => infoLogger.warn({ message, ...meta }),
  info: (message: string, meta?: any) => infoLogger.info({ message, ...meta }),
  verbose: (message: string, meta?: any) => infoLogger.verbose({ message, ...meta }),
  debug: (message: string, meta?: any) => infoLogger.debug({ message, ...meta }),
  silly: (message: string, meta?: any) => infoLogger.silly({ message, ...meta }),
}

export const logFormat = (clientRequest: LogRequest, clientResponse: LogResponse) => {
  return {
    request: {
      method: clientRequest.method,
      body: clientRequest.body,
      url: {
        path: clientRequest.originalUrl,
      },
      client: {
        ip: clientRequest.header?.('x-forwarded-for') || clientRequest.socket?.remoteAddress,
        port: clientRequest.socket?.remotePort,
      },
    },
    response: clientResponse,
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
      body: config.data,
      url: {
        path: config.url,
      },
    },
    response: {
      statusCode: response.status,
      message: response.statusText,
      body: response.data,
    },
    error: response.isAxiosError
      ? {
          message: response.message,
          stack: response.stack,
        }
      : undefined,
  }
}