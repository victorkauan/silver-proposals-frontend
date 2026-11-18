import { errorMessage } from '@shared/api/error-message.helper'
import { ApiError, UNEXPECTED_ERROR_MESSAGE } from '@shared/api/http.client'

describe('errorMessage', () => {
  it('uses the API message', () => {
    expect(errorMessage(new ApiError(401, 'x', 'Mensagem da API'))).toBe('Mensagem da API')
  })

  it('falls back to a generic message', () => {
    expect(errorMessage(new Error('boom'))).toBe(UNEXPECTED_ERROR_MESSAGE)
  })
})
