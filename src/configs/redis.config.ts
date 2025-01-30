/*
 * File: redis.config.ts
 * File Created: Sunday, 27th October 2024 6:50:30 pm
 * Url: https://arungpalakka.com
 * Author: Rede (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import { createClient, RedisClientType } from 'redis'
import dotenv from 'dotenv'

dotenv.config()

export class RedisConnection {
  private static instance: RedisConnection
  private client: RedisClientType
  private isConnected: boolean = false

  private constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        reconnectStrategy: (retries: number) => {
          const delay = Math.min(retries * 1000, 5000)
          console.log(`Reconnecting to Redis... Attempt ${retries}`)
          return delay
        },
      },
      password: process.env.REDIS_PASSWORD || 'Password135!',
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err)
      this.isConnected = false
    })

    this.client.on('connect', () => {
      console.log('Redis Client Connected')
      this.isConnected = true
    })

    this.client.on('end', () => {
      console.log('Redis Client Connection Ended')
      this.isConnected = false
    })
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection()
    }
    return RedisConnection.instance
  }

  public getClient(): RedisClientType {
    return this.client
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect()
      this.isConnected = false
    }
  }
}
