import { Navigate, Outlet, useLocation } from 'react-router'

import { FullPageSpinner } from '@shared/components/full-page-spinner'
import { useSession } from '@features/auth/session.context'

export function GuestOnly() {
  const { status } = useSession()
  const { state } = useLocation()
  const from = (state as { from?: string } | null)?.from ?? '/'

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to={from} replace />
  return <Outlet />
}
