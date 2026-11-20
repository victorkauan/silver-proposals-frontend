import { requestJson } from '@shared/api/http.client'
import type { LoginInput, RegisterInput } from '@features/auth/auth.schema'
import type { LoginResponse, TokenResponse } from '@features/auth/auth.type'

export const authApi = {
  register: ({ acceptPrivacy, ...input }: RegisterInput) =>
    requestJson<TokenResponse>('/auth/register', {
      method: 'POST',
      body: { ...input, accept_privacy: acceptPrivacy },
      auth: false,
    }),
  login: (input: LoginInput) =>
    requestJson<LoginResponse>('/auth/login', { method: 'POST', body: input, auth: false }),
  loginTwoFactor: (challengeToken: string, code: string) =>
    requestJson<TokenResponse>('/auth/login/two-factor', {
      method: 'POST',
      body: { challenge_token: challengeToken, code },
      auth: false,
    }),
  refresh: () => requestJson<TokenResponse>('/auth/refresh', { method: 'POST', auth: false }),
  logout: () => requestJson<void>('/auth/logout', { method: 'POST', auth: false }),
}
