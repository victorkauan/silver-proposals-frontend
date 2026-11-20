export type User = {
  id: string
  email: string
  name: string
  created_at: string
  privacy_up_to_date: boolean
  privacy_accepted_at: string | null
}

export type TokenResponse = {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  user: User
}
