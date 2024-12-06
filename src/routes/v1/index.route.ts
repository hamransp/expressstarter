/*
 * File: index.route.ts
 * File Created: Wednesday, 23rd October 2024 12:45:15 pm
 * Url: https://arungpalakka.com
 * Author: Rede (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import express from 'express'
import { starter } from '../../controllers/starter.controller'
const router = express.Router()
router.use(
  express.json({
    strict: false,
    limit: '1mb',
    type: ['application/json', 'text/plain'],
  })
)
router.route('/').get((req, res) => {
  res.send(`<h2>Hello Development API V1 Starter  from ${req.baseUrl}</h2>`)
})

router.get('/starter',starter)
export default router
