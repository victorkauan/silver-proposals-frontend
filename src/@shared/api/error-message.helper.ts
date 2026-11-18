import { ApiError, UNEXPECTED_ERROR_MESSAGE } from '@shared/api/http.client'

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : UNEXPECTED_ERROR_MESSAGE
}
