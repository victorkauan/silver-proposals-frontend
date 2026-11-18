import { Navigate, Outlet } from 'react-router'

import { FullPageSpinner } from '@shared/components/full-page-spinner'
import { useSession } from '@features/auth/session.context'

export function GuestOnly() {
  const { status } = useSession()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}
