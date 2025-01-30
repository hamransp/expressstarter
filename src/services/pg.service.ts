/*
 * File: db2.service.ts
 * File Created: Monday, 12th August 2024 12:20:32 pm
 * Url: https://arungpalakka.com
 * Author: Rede (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import { Sequelize, Transaction } from 'sequelize'
import EnhancedConfigSecurity from '../configs/ConfigSecurity';
import * as path from 'path';
import fs from 'fs'
import { config } from 'dotenv'
import * as crypto from 'crypto';
config()

interface Configuration {
  dbName: string
  dbUser: string
  dbPassword: string
  dbHost: string
  dbPort: number
  dbDialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2'
}

class Database {
  public static instance: Database | null = null
  public configuration: Configuration | null = null
  public connection: Sequelize | null = null

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  async connect(): Promise<Sequelize> {
    if (this.connection) {
      return this.connection;
    }

    try {
      const environment = process.env.NODE_ENV || 'development';
      this.configuration = await Database.loadConfiguration(environment);

      const { dbName, dbUser, dbPassword, dbHost, dbPort, dbDialect } =
        this.configuration;

      if (!dbDialect) {
        throw new Error('Database dialect is not provided');
      }

      this.log(`Connecting to Database ${dbName} at Host ${dbHost} (${environment} mode)`);

      this.connection = new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: dbDialect,
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
      });

      await this.checkConnection();
      return this.connection;
    } catch (error: any) {
      this.logError('Connection fail:', error);
      throw error;
    }
}

  private configurePool() {
    return {
      max: 100,
      min: 10,
      acquire: 60000,
      idle: 600000, // 10 minutes
    }
  }

  async transaction() {
    if (!this.connection) {
      throw new Error('Database connection is not established')
    }
    return this.connection.transaction()
  }

  private async checkConnection() {
    try {
      await this.connection!.authenticate()
      this.log(`Database connected, PID: ${process.pid}`)
    } catch (error: any) {
      this.logError('Database connection failed:', error)
      throw error
    }
  }

  async closeConnection() {
    if (this.connection) {
      await this.connection.close()
      this.log('Database connection closed')
    }
  }

  private static getConfigPath(environment: string): string {
    const isProduction = environment === 'production';
    const basePath = isProduction ? 'dist' : 'src';
    const dbName = process.env.DB_NAME;
    
    if (!dbName) {
      throw new Error('DB_NAME environment variable is not set');
    }
    
    return path.join(process.cwd(), basePath, 'databases', `${environment}_${dbName}.enc.ini`);
}

private static async loadConfiguration(environment: string): Promise<Configuration> {
  try {
    const masterKey = process.env.CONFIG_MASTER_KEY;
    const additionalKey = process.env.CONFIG_ADDITIONAL_KEY;
    
    if (!masterKey || !additionalKey) {
      throw new Error('Encryption keys not found in environment variables');
    }

    if (!process.env.DB_NAME) {
      throw new Error('DB_NAME environment variable is not set');
    }
    
    const combinedKey = crypto
      .createHash('sha256')
      .update(masterKey + additionalKey)
      .digest('hex');

    const configPath = this.getConfigPath(environment);
    
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      throw new Error(`Konfigurasi database tidak ditemukan di: ${configPath}\n` + 
        `Pastikan:\n` +
        `1. Anda sudah menjalankan 'node ${environment === 'production' ? 'dist' : 'src'}/configs/keyGenerator.js'\n` +
        `2. Environment variables sudah diset:\n` +
        `   - NODE_ENV=${environment}\n` +
        `   - DB_NAME=${process.env.DB_NAME || '[belum diset]'}`);
    }

    const configSecurity = new EnhancedConfigSecurity();
    return await configSecurity.decryptFromFile(configPath, combinedKey);
  } catch (error: any) {
    // this.logError('Kesalahan saat memuat konfigurasi:', new Error(error.message));
    // throw error;
    throw new Error(`Configuration load failed: ${error.message}`);
  }
}

  private log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }

  private logQuery(query: string) {
    this.log(`Query: ${query}`)
  }

  private logError(message: string, error: Error) {
    console.error(`[${new Date().toISOString()}] ${message}`, error.message)
  }

  private isProduction(): boolean {
    // cek apakah environment production
    return process.env.NODE_ENV === 'production' // artinya kalo production return true
  }
}

export default Database
