/*
 * File: login.rule.ts
 * File Created: Monday, 1st July 2024 1:54:53 pm
 * Url: https://arungpalakka.com
 * Author: Rede (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
import { z } from 'zod';

const loginSchema = {
  user: z.string()
    .min(1, 'User wajib diisi')
    .min(5, 'User minimal 5 karakter')
    .max(50, 'User maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'User hanya boleh mengandung huruf, angka, dan underscore')
    .trim(),
  pass: z.string()
    .min(1, 'Password wajib diisi')
    .min(5, 'Password minimal 5 karakter')
    .max(50, 'Password maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Password hanya boleh mengandung huruf, angka, dan underscore')
    .trim(),
}

export const loginRule = z.object(loginSchema).strict({
  message: 'Request tidak valid, hanya parameter user dan pass yang diizinkan'
});