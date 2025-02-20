/*
 * File: database.service.ts
 * Project: starterexpress
 * File Created: Thursday, 30th January 2025 1:49:43 pm
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Thursday, 20th February 2025 10:30:44 am
 * Copyright 2017 - 2022 10RI Dev
 */

// MultiDatabase.service.ts
import { Sequelize, Transaction, TransactionOptions } from 'sequelize'
import EnhancedConfigSecurity from '../configs/ConfigSecurity'
import * as path from 'path'
import fs from 'fs'
import { config } from 'dotenv'
import * as crypto from 'crypto'
import { logger } from '../libs/winston.lib'
import { getRequestId } from '../helpers/requestContext.helper';
config()

interface DatabaseConfig {
  dbName: string
  dbUser: string
  dbPassword: string
  dbHost: string
  dbPort: number
  dbDialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2'
  [key: string]: string | number // Add index signature
}

class MultiDatabase {
  private static instance: MultiDatabase
  private connections: Map<string, Sequelize>
  private configurations: Map<string, DatabaseConfig>

  private constructor() {
    this.connections = new Map()
    this.configurations = new Map()
  }

  static getInstance(): MultiDatabase {
    if (!MultiDatabase.instance) {
      MultiDatabase.instance = new MultiDatabase()
    }
    return MultiDatabase.instance
  }

  async connect(dbKey: string): Promise<Sequelize> {
    if (this.connections.has(dbKey)) {
      return this.connections.get(dbKey)!
    }

    try {
      const environment = process.env.NODE_ENV || 'development'
      const config = await this.loadConfiguration(environment, dbKey)
      
      // Validate configuration
      this.validateDatabaseConfig(config)
      
      // Configure dialect-specific options
      const dialectOptions = this.getDialectOptions(config.dbDialect)
      
      const connection = new Sequelize(
        config.dbName,
        config.dbUser,
        config.dbPassword,
        {
          host: config.dbHost,
          port: config.dbPort,
          dialect: config.dbDialect,
          isolationLevel: Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
          pool: this.configurePool(),
          timezone: '+08:00',
          define: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
          },
          // logging: this.queryLogger.bind(this),
          logging: (sql: string, timing?: number) => {
            this.queryLogger(sql, timing);
          },
          dialectOptions,
        }
      )

      // Set connection timeout
      this.setupQueryTimeout(connection, dbKey)

      await this.checkConnection(connection, dbKey)
      this.connections.set(dbKey, connection)
      return connection

    } catch (error: any) {
      this.logError(`Connection fail for database ${dbKey}:`, error)
      throw error
    }
  }

  private getDialectOptions(dialect: string) {
    const baseOptions = {
      connectTimeout: 60000
    }

    switch (dialect) {
      case 'postgres':
        return {
          ...baseOptions,
          // Only enable SSL in production
          ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: true
          } : false
        }
      
      case 'mssql':
        return {
          ...baseOptions,
          options: {
            encrypt: true,
            trustServerCertificate: process.env.NODE_ENV !== 'production'
          }
        }
      
      case 'db2':
        return {
          ...baseOptions,
          // Add any DB2 specific options here
        }
      
      default:
        return baseOptions
    }
  }

  private validateDatabaseConfig(config: DatabaseConfig) {
    const requiredFields = ['dbName', 'dbUser', 'dbPassword', 'dbHost', 'dbPort', 'dbDialect']
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing required configuration field: ${field}`)
      }
    }

    // Validate port range
    if (config.dbPort < 0 || config.dbPort > 65535) {
      throw new Error('Invalid port number')
    }

    // Validate allowed dialects
    const allowedDialects = ['postgres', 'mysql', 'mariadb', 'mssql', 'db2']
    if (!allowedDialects.includes(config.dbDialect)) {
      throw new Error(`Unsupported dialect: ${config.dbDialect}`)
    }
  }

  private setupQueryTimeout(connection: Sequelize, dbKey: string) {
    const timeoutMs = 30000 // 30 seconds

    connection.addHook('beforeQuery', (options: any) => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Query timeout after ${timeoutMs}ms`))
        }, timeoutMs)

        // We need to resolve immediately to not block the query
        resolve()

        // Add cleanup hook
        connection.addHook('afterQuery', () => {
          clearTimeout(timeout)
        })
      })
    })
  }

  // private queryLogger(sql: string, timing?: number) {
  //   logger.info('Database Query', {
  //     sql: this.sanitizeQuery(sql),
  //     details: timing,
  //     timestamp: new Date().toISOString()
  //   });
  // }
  private queryLogger(sql: string, timing?: number) {
    const requestId = getRequestId();
    
    logger.info('Database Query', {
      sql: this.sanitizeQuery(sql),
      details: timing,
      timestamp: new Date().toISOString(),
      requestId
    });
  }

  private sanitizeQuery(sql: string): string {
    // Remove sensitive data from logs
    return sql.replace(/password.*?[0-9a-zA-Z]+'/, "password='[REDACTED]'");
  }

  async transaction(dbKey: string, options: TransactionOptions = {}) {
    const connection = this.connections.get(dbKey)
    if (!connection) {
      throw new Error(`Database connection ${dbKey} is not established`)
    }

    const defaultOptions: TransactionOptions = {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      autocommit: false
    }

    return connection.transaction({
      ...defaultOptions,
      ...options
    })
  }

  private async checkConnection(connection: Sequelize, dbKey: string) {
    try {
      await connection.authenticate()
      this.log(`Database ${dbKey} connected, PID: ${process.pid}`)
    } catch (error: any) {
      this.logError(`Database ${dbKey} connection failed:`, error)
      throw error
    }
  }

  async closeConnection(dbKey?: string) {
    if (dbKey) {
      const connection = this.connections.get(dbKey)
      if (connection) {
        await connection.close()
        this.connections.delete(dbKey)
        this.log(`Database ${dbKey} connection closed`)
      }
    } else {
      // Close all connections
      for (const [key, connection] of this.connections) {
        await connection.close()
        this.log(`Database ${key} connection closed`)
      }
      this.connections.clear()
    }
  }

  private async loadConfiguration(
    environment: string,
    dbKey: string
  ): Promise<DatabaseConfig> {
    try {
      const masterKey = process.env.CONFIG_MASTER_KEY
      const additionalKey = process.env.CONFIG_ADDITIONAL_KEY

      if (!masterKey || !additionalKey) {
        throw new Error('Encryption keys not found in environment variables')
      }

      const combinedKey = crypto
        .createHash('sha256')
        .update(masterKey + additionalKey)
        .digest('hex')

      const configPath = this.getConfigPath(environment, dbKey)
      
      if (!fs.existsSync(configPath)) {
        throw new Error(
          `Database configuration not found at: ${configPath}\n` +
          `Make sure:\n` +
          `1. You have run 'node ${environment === 'production' ? 'dist' : 'src'}/configs/keyGenerator.js'\n` +
          `2. Environment variables are set:\n` +
          `   - NODE_ENV=${environment}\n` +
          `   - DB_NAME=${process.env.DB_NAME || '[not set]'}`
        )
      }

      const configSecurity = new EnhancedConfigSecurity()
      const config = await configSecurity.decryptFromFile(configPath, combinedKey)

      // Ensure port is a number
      return {
        ...config,
        dbPort: Number(config.dbPort)
      }
    } catch (error: any) {
      throw new Error(`Configuration load failed for ${dbKey}: ${error.message}`)
    }
  }

  private getConfigPath(environment: string, dbKey: string): string {
    const isProduction = environment === 'production'
    const basePath = isProduction ? 'dist' : 'src'
    return path.join(
      process.cwd(),
      basePath,
      'databases',
      `${environment}_${dbKey}.enc.ini`
    )
  }

  private configurePool() {
    return {
      max: 100,
      min: 10,
      acquire: 60000,
      idle: 600000, // 10 minutes
    }
  }

  private log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }

  private logError(message: string, error: Error) {
    console.error(`[${new Date().toISOString()}] ${message}`, error.message)
  }
}

export default MultiDatabase