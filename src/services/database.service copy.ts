/*
 * File: database.service.ts
 * Project: starterexpress
 * File Created: Thursday, 30th January 2025 1:49:43 pm
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Thursday, 30th January 2025 2:51:53 pm
 * Copyright 2017 - 2022 10RI Dev
 */

// MultiDatabase.service.ts
import { Sequelize, Transaction } from 'sequelize'
import EnhancedConfigSecurity from '../configs/ConfigSecurity'
import * as path from 'path'
import fs from 'fs'
import { config } from 'dotenv'
import * as crypto from 'crypto'
import { logger } from '../libs/winston.lib'
config()

interface DatabaseConfig {
  dbName: string
  dbUser: string
  dbPassword: string
  dbHost: string
  dbPort: number
  dbDialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2'
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
    // Return existing connection if available
    if (this.connections.has(dbKey)) {
      return this.connections.get(dbKey)!
    }

    try {
      const environment = process.env.NODE_ENV || 'development'
      const config = await this.loadConfiguration(environment, dbKey)
      this.configurations.set(dbKey, config)

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
          logging: false,
          dialectOptions: {
            connectTimeout: 60000,
          },
        }
      )

      await this.checkConnection(connection, dbKey)
      this.connections.set(dbKey, connection)
      return connection

    } catch (error: any) {
      this.logError(`Connection fail for database ${dbKey}:`, error)
      throw error
    }
  }

  async transaction(dbKey: string) {
    const connection = this.connections.get(dbKey)
    if (!connection) {
      throw new Error(`Database connection ${dbKey} is not established`)
    }
    return connection.transaction()
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
      return await configSecurity.decryptFromFile(configPath, combinedKey)
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