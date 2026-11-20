import { Navigate, type RouteObject } from 'react-router'

import { FullPageSpinner } from '@shared/components/full-page-spinner'
import { HomePage } from '@features/app/pages/home'
import { GuestOnly } from '@features/auth/components/guest-only'
import { RequireAuth } from '@features/auth/components/require-auth'
import { LoginPage } from '@features/auth/pages/login'
import { RegisterPage } from '@features/auth/pages/register'

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
    hydrateFallbackElement: <FullPageSpinner />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/propostas/nova',
        lazy: () =>
          import('@features/proposals/pages/new-proposal').then((m) => ({
            Component: m.NewProposalPage,
          })),
      },
      {
        path: '/propostas/:id',
        lazy: () =>
          import('@features/proposals/pages/proposal').then((m) => ({ Component: m.ProposalPage })),
      },
      {
        path: '/propostas/:id/editar',
        lazy: () =>
          import('@features/proposals/pages/proposal-editor').then((m) => ({
            Component: m.ProposalEditorPage,
          })),
      },
      { path: '/conta', element: <Navigate to="/conta/perfil" replace /> },
      {
        path: '/conta/perfil',
        lazy: () =>
          import('@features/account/pages/profile').then((m) => ({ Component: m.ProfilePage })),
      },
      {
        path: '/conta/seguranca',
        lazy: () =>
          import('@features/account/pages/security').then((m) => ({ Component: m.SecurityPage })),
      },
      {
        path: '/conta/dados',
        lazy: () => import('@features/account/pages/data').then((m) => ({ Component: m.DataPage })),
      },
      {
        path: '/propostas/:id/historico',
        lazy: () =>
          import('@features/proposals/pages/proposal-history').then((m) => ({
            Component: m.ProposalHistoryPage,
          })),
      },
    ],
  },
  {
    path: '/privacidade',
    hydrateFallbackElement: <FullPageSpinner />,
    lazy: () =>
      import('@features/privacy/pages/privacy').then((m) => ({ Component: m.PrivacyPage })),
  },
  {
    path: '/p/:token',
    hydrateFallbackElement: <FullPageSpinner />,
    lazy: () =>
      import('@features/proposals/pages/public-proposal').then((m) => ({
        Component: m.PublicProposalPage,
      })),
  },
  { path: '*', element: <Navigate to="/" replace /> },
]
