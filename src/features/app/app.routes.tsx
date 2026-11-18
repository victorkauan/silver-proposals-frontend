import { Navigate, type RouteObject } from 'react-router'

import { HomePage } from '@features/app/pages/home'
import { GuestOnly } from '@features/auth/components/guest-only'
import { RequireAuth } from '@features/auth/components/require-auth'
import { LoginPage } from '@features/auth/pages/login'
import { RegisterPage } from '@features/auth/pages/register'
import { NewProposalPage } from '@features/proposals/pages/new-proposal'
import { ProposalPage } from '@features/proposals/pages/proposal'

export const routes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      { path: '/entrar', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/propostas/nova', element: <NewProposalPage /> },
      { path: '/propostas/:id', element: <ProposalPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]
