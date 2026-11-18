export type User = {
  id: string
  email: string
  name: string
}

export type TokenResponse = {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  user: User
}
