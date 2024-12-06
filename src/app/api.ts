/*
 * File: api.ts
 * Project: starterexpress
 * File Created: Friday, 6th December 2024 9:07:09 am
 * Author: Rede (hamransp@gmail.com)
 * Last Modified: Friday, 6th December 2024 9:37:23 am
 * Copyright 2017 - 2022 10RI Dev
 */

import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'

import v1 from '../routes/v1/index.route'
// import v2 from '../routes/v2/index.route'
import { logger, logFormat } from '../libs/winston.lib'
import { responseApi } from '../helpers/responseApi.helper'

dotenv.config()

const app = express()
const port = process.env.PORT || 4888

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: (req, res) => {
    const response = {
      code: 429,
      message: 'Anda telah melebihi batas request, silahkan coba lagi nanti',
      data: { ip: req.ip, limit: 10, window: '1 menit' },
    }
    logger.info(
      'Anda telah melebihi batas request, silahkan coba lagi nanti',
      logFormat(req, response)
    )
    res.status(429).json(responseApi(429, response.message))
  },
})

app.use(cors())
app.use(limiter)
app.use('/api/v1', v1)
// app.use('/api/v2', v2)
app.use(express.json({ strict: false }))

app.use('/', (req, res) => {
  const response = {
    code: 401,
    message: 'Selamat Datang Di API Starter Express'
  }
  logger.info(
    'Selamat Datang Di API Kirim Email Bank Sultra',
    logFormat(req, response)
  )
  res
    .status(401)
    .json(responseApi(404, 'Selamat Datang Di API Starter Express'))
})

export { app, port }
