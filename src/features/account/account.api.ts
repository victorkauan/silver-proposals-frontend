import { request, requestJson } from '@shared/api/http.client'
import type { User } from '@features/auth/auth.type'

export const EXPORT_FILE_NAME = 'silver-proposals-dados.json'

export const accountApi = {
  updateProfile: (name: string) =>
    requestJson<User>('/account', { method: 'PATCH', body: { name } }),
  changeEmail: (email: string, password: string) =>
    requestJson<User>('/account/email', { method: 'PUT', body: { email, password } }),
  acceptPrivacy: () => requestJson<User>('/account/privacy-acceptance', { method: 'POST' }),
  exportData: async () => (await request('/account/export')).blob(),
  deleteAccount: (password: string) =>
    requestJson<void>('/account/delete', { method: 'POST', body: { password } }),
}
