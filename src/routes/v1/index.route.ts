/*
 * File: index.route.ts
 * File Created: Wednesday, 23rd October 2024 12:45:15 pm
 * Url: https://arungpalakka.com
 * Author: Rede (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import express from 'express'
import { starter, login, refresh, systemHost, systemHostdb2, systemHostSamsatnew } from '../../controllers/starter.controller'
import { validate, validateLogin } from '../../middlewares/validator.middleware'
import { loginRule } from '../../rules/auth/login.rule'
import { starterRule } from '../../rules/starter.rule'
import { refreshTokennRule } from '../../rules/auth/refreshToken.rule'

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

router.get('/starter',validate(starterRule), starter)
router.post('/login', validateLogin(loginRule), starter)
router.get('/systemhost',systemHost)
router.get('/systemhostdb2',systemHostdb2)
router.get('/systemhostsamsatnew',systemHostSamsatnew)
export default router
