export type User = {
  id: string
  email: string
  name: string
  created_at: string
  privacy_up_to_date: boolean
  privacy_accepted_at: string | null
  two_factor_enabled: boolean
}

export type TokenResponse = {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  user: User
}

export type TwoFactorChallenge = {
  two_factor_required: true
  challenge_token: string
  expires_in: number
}

export type LoginResponse = TokenResponse | TwoFactorChallenge

export type LoginResult = { status: 'signed_in' } | { status: 'two_factor'; challengeToken: string }
