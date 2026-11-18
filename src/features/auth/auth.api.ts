import { requestJson } from '@shared/api/http.client'
import type { LoginInput, RegisterInput } from '@features/auth/auth.schema'
import type { TokenResponse } from '@features/auth/auth.type'

export const authApi = {
  register: (input: RegisterInput) =>
    requestJson<TokenResponse>('/auth/register', { method: 'POST', body: input, auth: false }),
  login: (input: LoginInput) =>
    requestJson<TokenResponse>('/auth/login', { method: 'POST', body: input, auth: false }),
  refresh: () => requestJson<TokenResponse>('/auth/refresh', { method: 'POST', auth: false }),
  logout: () => requestJson<void>('/auth/logout', { method: 'POST', auth: false }),
}
