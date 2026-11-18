import { Navigate, Outlet, useLocation } from 'react-router'

import { FullPageSpinner } from '@shared/components/full-page-spinner'
import { useSession } from '@features/auth/session.context'

export function RequireAuth() {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'anonymous') {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
