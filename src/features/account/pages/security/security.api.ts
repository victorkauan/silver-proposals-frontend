import { requestJson } from '@shared/api/http.client'

type TwoFactorStatus = {
  enabled: boolean
  enabled_at: string | null
  recovery_codes_remaining: number
}

export type TwoFactorSetup = { secret: string; otpauth_uri: string }

export type ActiveSession = {
  id: string
  started_at: string
  last_active_at: string
  expires_at: string
  user_agent: string | null
  current: boolean
}

type RecoveryCodes = { codes: string[] }
type RevokedSessions = { revoked: number }

export const securityApi = {
  status: () => requestJson<TwoFactorStatus>('/account/two-factor'),
  setup: (password: string) =>
    requestJson<TwoFactorSetup>('/account/two-factor/setup', {
      method: 'POST',
      body: { password },
    }),
  enable: (code: string) =>
    requestJson<RecoveryCodes>('/account/two-factor/enable', { method: 'POST', body: { code } }),
  disable: (password: string, code: string) =>
    requestJson<void>('/account/two-factor/disable', { method: 'POST', body: { password, code } }),
  regenerate: (password: string) =>
    requestJson<RecoveryCodes>('/account/two-factor/recovery-codes', {
      method: 'POST',
      body: { password },
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    requestJson<RevokedSessions>('/account/password', {
      method: 'PUT',
      body: { current_password: currentPassword, new_password: newPassword },
    }),
  sessions: () => requestJson<ActiveSession[]>('/account/sessions'),
  endSession: (id: string) => requestJson<void>(`/account/sessions/${id}`, { method: 'DELETE' }),
  endOtherSessions: () =>
    requestJson<RevokedSessions>('/account/sessions/revoke-others', { method: 'POST' }),
}
