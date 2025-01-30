/*
 * File: keyGenerator.ts
 * File Created: Thursday, 24th October 2024 9:54:51 am
 * Url: https://arungpalakka.com
 * Author: tsi (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import * as path from 'path';

interface EncryptionConfig {
  algorithm: string;
  keyDerivationIterations: number;
  saltLength: number;
  tagLength: number;
  keyLength: number;
  nonceLength: number;
  noiseLength: number;
  environmentKey?: string;  // Tambahkan environment key
}
class ConfigSecurity {
  private readonly config: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyDerivationIterations: 100000,
    saltLength: 32,
    tagLength: 16,
    keyLength: 32,
    nonceLength: 12,
    noiseLength: 32
  };

  private getSystemInfo(): { [key: string]: string } {
    const networkInterfaces = os.networkInterfaces();
    const mainInterface = Object.values(networkInterfaces)
      .flat()
      .find((netInterface) => netInterface?.internal === false);

    return {
      cpuInfo: os.cpus()[0].model,
      totalMemory: os.totalmem().toString(),
      hostname: os.hostname(),
      macAddress: process.platform !== 'win32' && mainInterface ? mainInterface.mac : '',
      diskSerial: this.getDiskSerial()
    };
  }

  private getDiskSerial(): string {
    if (process.platform === 'linux') {
      try {
        return execSync("udevadm info --query=property --name=/dev/sda | grep ID_SERIAL").toString();
      } catch {
        return '';
      }
    }
    return '';
  }

  private getHardwareFingerprint(): string {
    try {
      const systemInfo = this.getSystemInfo();
      const hardwareString = Object.values(systemInfo).join('|');
      
      return crypto
        .createHash('sha256')
        .update(hardwareString)
        .digest('hex');
    } catch (error) {
      throw new Error('Hardware fingerprint generation failed');
    }
  }

  private deriveKey(masterKey: string, salt: Buffer): Buffer {
    const envKey = process.env.ENCRYPTION_ENV_KEY || this.config.environmentKey;
    return crypto.pbkdf2Sync(
      `${masterKey}:${envKey}`,  // Gunakan environment key sebagai pengganti hardware fingerprint
      salt,
      this.config.keyDerivationIterations,
      this.config.keyLength,
      'sha512'
    );
  }

  private createEncryptionComponents(): { salt: Buffer; noise: Buffer; nonce: Buffer } {
    return {
      salt: crypto.randomBytes(this.config.saltLength),
      noise: crypto.randomBytes(this.config.noiseLength),
      nonce: crypto.randomBytes(this.config.nonceLength)
    };
  }

  async encrypt(data: string, masterKey: string): Promise<string> {
    try {
      const { salt, noise, nonce } = this.createEncryptionComponents();
      const key = this.deriveKey(masterKey, salt);
      
      // Explicitly type the cipher as crypto.CipherGCM
      const cipher = crypto.createCipheriv(
        this.config.algorithm,
        key,
        nonce
      ) as crypto.CipherGCM;
      
      const mixedData = Buffer.concat([Buffer.from(data, 'utf8'), noise]);
      const encrypted = Buffer.concat([cipher.update(mixedData), cipher.final()]);
      const tag = cipher.getAuthTag();
      
      const finalBuffer = Buffer.concat([salt, nonce, tag, encrypted]);
      return `v2:${finalBuffer.toString('base64')}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async decrypt(encryptedData: string, masterKey: string): Promise<string> {
    try {
      const [version, data] = encryptedData.split(':');
      if (version !== 'v2') throw new Error('Unsupported encryption version');

      const buffer = Buffer.from(data, 'base64');
      const components = this.extractComponents(buffer);
      
      const key = this.deriveKey(masterKey, components.salt);
      
      // Explicitly type the decipher as crypto.DecipherGCM
      const decipher = crypto.createDecipheriv(
        this.config.algorithm,
        key,
        components.nonce
      ) as crypto.DecipherGCM;
      
      decipher.setAuthTag(components.tag);
      
      const decrypted = Buffer.concat([
        decipher.update(components.encrypted),
        decipher.final()
      ]);
      
      return decrypted
        .slice(0, decrypted.length - this.config.noiseLength)
        .toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private extractComponents(buffer: Buffer) {
    const { saltLength, nonceLength, tagLength } = this.config;
    let offset = 0;

    const salt = buffer.slice(offset, saltLength);
    offset += saltLength;

    const nonce = buffer.slice(offset, offset + nonceLength);
    offset += nonceLength;

    const tag = buffer.slice(offset, offset + tagLength);
    offset += tagLength;

    const encrypted = buffer.slice(offset);

    return { salt, nonce, tag, encrypted };
  }

  async encryptToFile(data: string, outputPath: string, masterKey: string): Promise<void> {
    try {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const encrypted = await this.encrypt(data, masterKey);
      fs.writeFileSync(outputPath, encrypted);
    } catch (error: unknown) {
      
      if (error instanceof Error) {
        throw new Error(`File encryption failed: ${error.message}`);
      }

    }
  }

  async decryptFromFile(inputPath: string, masterKey: string): Promise<any> {
    try {
      if (!fs.existsSync(inputPath)) {
        throw new Error('Encrypted file not found');
      }

      const encrypted = fs.readFileSync(inputPath, 'utf8');
      const decrypted = await this.decrypt(encrypted, masterKey);
      return JSON.parse(decrypted);
    } catch (error: unknown) {
      
      if (error instanceof Error) {
        throw new Error(`File encryption failed: ${error.message}`);
      }
      
    }
  }
}

export default ConfigSecurity;