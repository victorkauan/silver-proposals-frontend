import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { setAccessToken, setRefreshHandler } from '@shared/api/http.client'
import { authApi } from '@features/auth/auth.api'
import type { TokenResponse, User } from '@features/auth/auth.type'
import { type Session, SessionContext, type SessionStatus } from '@features/auth/session.context'

type State = { status: SessionStatus; user: User | null }

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<State>({ status: 'loading', user: null })
  const refreshing = useRef<Promise<string | null> | null>(null)

  const apply = useCallback((data: TokenResponse | null) => {
    setAccessToken(data?.access_token ?? null)
    setState(
      data ? { status: 'authenticated', user: data.user } : { status: 'anonymous', user: null },
    )
  }, [])

  // One refresh at a time: the backend revokes the session when a rotated token is reused.
  const refresh = useCallback(() => {
    refreshing.current ??= authApi
      .refresh()
      .then((data) => {
        apply(data)
        return data.access_token
      })
      .catch(() => {
        apply(null)
        return null
      })
      .finally(() => {
        refreshing.current = null
      })
    return refreshing.current
  }, [apply])

  useEffect(() => {
    setRefreshHandler(refresh)
    void refresh()
    return () => setRefreshHandler(null)
  }, [refresh])

  const session = useMemo<Session>(
    () => ({
      ...state,
      login: async (input) => apply(await authApi.login(input)),
      register: async (input) => apply(await authApi.register(input)),
      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          apply(null)
          queryClient.clear()
        }
      },
    }),
    [state, apply, queryClient],
  )

  return <SessionContext value={session}>{children}</SessionContext>
}
