/*
 * File: keyGenerator.ts
 * File Created: Thursday, 24th October 2024 9:59:28 am
 * Url: https://arungpalakka.com
 * Author: tsi (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import ConfigSecurity from './ConfigSecurity';
import { config } from 'dotenv';
import * as crypto from 'crypto';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
config();

interface DatabaseConfig {
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbHost: string;
  dbPort: string;
  dbDialect: string;
}

interface PromptOptions {
  message: string;
  isPassword?: boolean;
  validator?: (input: string) => string | null;
}

class ConfigGenerator {
  private static readonly VALID_DIALECTS = ['mysql', 'postgres', 'sqlite', 'mariadb', 'mssql', 'db2'];
  private stdin: NodeJS.ReadStream;
  private stdout: NodeJS.WriteStream;

  constructor() {
    this.stdin = process.stdin;
    this.stdout = process.stdout;
  }
    
  private createProtectedReadline(prompt: string): readline.Interface {
    const rl = readline.createInterface({
      input: this.stdin,
      output: this.stdout,
      prompt: prompt
    });

    // Simpan panjang prompt untuk proteksi
    const promptLength = prompt.length;
    
    // Override line event untuk mencegah penghapusan prompt
    const origLine = (rl as any)._line;
    (rl as any)._line = function() {
      const line = origLine.apply(this, arguments);
      if (this.line.length < promptLength) {
        this.line = prompt + (this.line.slice(promptLength) || '');
        this.cursor = Math.max(promptLength, this.cursor);
      }
      return line;
    };

    return rl;
  }

  private async promptInput(message: string): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: this.stdin,
        output: this.stdout
      });
  
      rl.question(message, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
  
      // Handle Ctrl+C
      rl.on('SIGINT', () => {
        rl.close();
        process.exit();
      });
    });
  }
  private async promptPassword(message: string): Promise<string> {
    const initialStdinMode = this.stdin.isRaw;
    let cursorPos = message.length;

    return new Promise((resolve) => {
      let password = '';
      
      // Set raw mode
      this.stdin.setRawMode(true);
      this.stdin.resume();
      this.stdout.write(message);

      const onData = (data: Buffer) => {
        const char = data.toString('utf8');
        const charCode = char.charCodeAt(0);

        // Handle Ctrl+C
        if (char === '\u0003') {
          cleanup();
          process.exit();
        }

        // Handle Enter
        if (char === '\r' || char === '\n') {
          cleanup();
          this.stdout.write('\n');
          resolve(password);
          return;
        }

        // Handle Backspace
        if (char === '\u0008' || char === '\u007f') {
          if (password.length > 0 && cursorPos > message.length) {
            password = password.slice(0, -1);
            cursorPos--;
            this.stdout.write('\b \b');
          }
          return;
        }

        // Handle paste (multiple characters)
        if (data.length > 3) {
          const pastedText = data.toString().trim();
          password += pastedText;
          this.stdout.write('*'.repeat(pastedText.length));
          cursorPos += pastedText.length;
          return;
        }

        // Handle regular characters
        if (charCode >= 32 && charCode <= 126) {
          password += char;
          cursorPos++;
          this.stdout.write('*');
        }
      };

      const cleanup = () => {
        this.stdin.removeListener('data', onData);
        this.stdin.setRawMode(initialStdinMode);
        this.stdin.pause();
      };

      this.stdin.on('data', onData);
    });
  }


  private async prompt({ message, isPassword = false, validator }: PromptOptions): Promise<string> {
    while (true) {
      const input = isPassword 
        ? await this.promptPassword(message)
        : await this.promptInput(message);

      if (!input) {
        console.log('Input tidak boleh kosong');
        continue;
      }

      const error = validator ? validator(input) : null;
      if (error) {
        console.log(`Error: ${error}`);
        continue;
      }

      return input;
    }
  }


  private validatePort(input: string): string | null {
    const port = parseInt(input);
    return (!isNaN(port) && port > 0 && port <= 65535)
      ? null
      : 'Port harus berupa angka antara 1-65535';
  }

  private validateDialect(input: string): string | null {
    return ConfigGenerator.VALID_DIALECTS.includes(input.toLowerCase())
      ? null
      : `Dialect harus salah satu dari: ${ConfigGenerator.VALID_DIALECTS.join(', ')}`;
  }

  async collectConfig(): Promise<DatabaseConfig | null> {
    console.log('\n=== Konfigurasi Database ===\n');

    try {
      const config = {
        dbName: await this.prompt({ message: 'Nama Database: ' }),
        dbUser: await this.prompt({ message: 'Username Database: ' }),
        dbPassword: await this.prompt({ 
          message: 'Password Database: ',
          isPassword: true 
        }),
        dbHost: await this.prompt({ message: 'Host Database: ' }),
        dbPort: await this.prompt({ 
          message: 'Port Database: ',
          validator: this.validatePort.bind(this)
        }),
        dbDialect: await this.prompt({ 
          message: 'Dialect Database (mysql/postgres/sqlite/mariadb/mssql/db2): ',
          validator: this.validateDialect.bind(this)
        })
      };

      if (await this.confirmConfig(config)) {
        return config;
      }

      console.log('\nKonfigurasi dibatalkan.');
      return null;
    } catch (error) {
      console.error('\nError:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private async confirmConfig(config: DatabaseConfig): Promise<boolean> {
    console.log('\n=== Konfirmasi Konfigurasi ===');
    Object.entries(config).forEach(([key, value]) => {
      console.log(`${key}: ${key === 'dbPassword' ? '*'.repeat(value.length) : value}`);
    });

    const confirm = await this.prompt({ message: '\nApakah konfigurasi sudah benar? (y/n): ' });
    return confirm.toLowerCase() === 'y';
  }

  private validateEnv(): string[] {
    const required = ['NODE_ENV', 'DB_NAME', 'CONFIG_MASTER_KEY', 'CONFIG_ADDITIONAL_KEY'];
    return required.filter(key => !process.env[key]);
  }

  private generateConfigFilename(dbName: string): string {
    const environment = process.env.NODE_ENV || 'development';
    return `${environment}_${dbName}.enc.ini`;
  }

  async run(): Promise<void> {
    try {
      const missingEnvVars = this.validateEnv();
      if (missingEnvVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      }

      const dbConfig = await this.collectConfig();
      if (!dbConfig) return;

      const security = new ConfigSecurity();
      const combinedKey = crypto
        .createHash('sha256')
        .update(process.env.CONFIG_MASTER_KEY! + process.env.CONFIG_ADDITIONAL_KEY!)
        .digest('hex');

      const outputPath = path.resolve(
        __dirname,
        '..',
        'databases',
        this.generateConfigFilename(dbConfig.dbName)
      );

      const data = JSON.stringify(dbConfig);
      await security.encryptToFile(data, outputPath, combinedKey);

      console.log('\n=== Encryption Complete ===');
      console.log('Status: Berhasil ✓');
      console.log('Output:', outputPath);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Database:', dbConfig.dbName);
      console.log('\nPenting: Pastikan lingkungan variable berikut sudah diset sebelum menjalankan aplikasi:');
      console.log('export NODE_ENV=' + process.env.NODE_ENV);
      console.log('export DB_NAME=' + dbConfig.dbName);

    } catch (error) {
      console.error('\n=== Error ===');
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}

// Run the generator
new ConfigGenerator().run().catch(console.error);