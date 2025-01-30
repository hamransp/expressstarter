/*
 * File: refreshToken.rule.ts
 * File Created: Friday, 13th September 2024 1:44:57 pm
 * Url: https://arungpalakka.com
 * Author: tsi (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import { z } from 'zod'
const refreshTokenSchema = {
  user: z.string().min(5, 'user is required'),
}

export const refreshTokennRule = z.object(refreshTokenSchema).strict({
  message: `Request tidak valid, hanya parameter ${Object.keys(refreshTokenSchema).join(', ')} yang diizinkan`
})
