/*
 * File: getWewenang.rule.ts
 * File Created: Wednesday, 3rd July 2024 2:04:53 pm
 * Url: https://arungpalakka.com
 * Author: Rede (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import { z } from 'zod'

export const starterRule = z.object({
  id_wewenang: z.string().min(1, 'ID Wewenang harus lebih dari 0'),
})
