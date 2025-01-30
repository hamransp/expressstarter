/*
 * File: responseApi.helper.ts
 * File Created: Wednesday, 23rd October 2024 12:39:56 pm
 * Url: https://arungpalakka.com
 * Author: Rede (hamransp@gmail.com)
 * Copyright @ 2024 Rede Studio
 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T | null
}

export function getMessageForCode(code: number): string {
  switch (code) {
    case 200:
      return 'OK'
    case 201:
      return 'Created'
    case 202:
      return 'Accepted'
    case 204:
      return 'No Content'
    case 400:
      return 'Bad Request'
    case 401:
      return 'Unauthorized'
    case 403:
      return 'Forbidden'
    case 404:
      return 'Not Found'
    case 405:
      return 'Method Not Allowed'
    case 409:
      return 'Conflict'
    case 422:
      return 'Unprocessable Entity'
    case 429:
      return 'Too Many Requests'
    case 500:
      return 'Internal Server Error'
    case 502:
      return 'Bad Gateway'
    case 503:
      return 'Service Unavailable'
    default:
      return 'Unknown Status'
  }
}

/**
 * Membuat response API dengan format standar
 *
 * @param code - Kode status HTTP
 * @param data - Data yang akan dikembalikan (optional)
 * @param customMessage - Pesan kustom (optional)
 * @returns Objek response API
 */
export function responseApi<T>(
  code: number,
  data: T | null = null,
  customMessage?: string
): ApiResponse<T> {
  const message = customMessage || getMessageForCode(code)
  return {
    code,
    message,
    data,
  }
}
