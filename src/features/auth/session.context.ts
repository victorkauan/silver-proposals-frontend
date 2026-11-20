import { createContext, useContext } from 'react'

import type { LoginInput, RegisterInput } from '@features/auth/auth.schema'
import type { User } from '@features/auth/auth.type'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'
export type SessionNotice = 'account_deleted'

export type Session = {
  status: SessionStatus
  user: User | null
  notice: SessionNotice | null
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  endSession: (notice?: SessionNotice) => void
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}
