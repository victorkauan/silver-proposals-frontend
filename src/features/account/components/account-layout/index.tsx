import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

import { cn } from '@shared/helpers/cn.helper'
import { formatDate } from '@shared/helpers/date.helper'
import { initials } from '@shared/helpers/initials.helper'
import { AppShell } from '@features/app/components/app-shell'
import { useSession } from '@features/auth/session.context'

const TABS = [
  { to: '/conta/perfil', label: 'Perfil' },
  { to: '/conta/seguranca', label: 'Segurança' },
  { to: '/conta/dados', label: 'Privacidade e dados' },
]

type AccountLayoutProps = {
  page: string
  children: ReactNode
}

export function AccountLayout({ page, children }: AccountLayoutProps) {
  const { user } = useSession()

  return (
    <AppShell page={page} parents={[{ label: 'Minha conta', to: '/conta' }]}>
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-lg font-semibold text-primary">
            {user ? initials(user.name) : ''}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">Minha conta</h1>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email}
              {user && <> · Membro desde {formatDate(user.created_at, 'short')}</>}
            </p>
          </div>
        </div>
        <nav aria-label="Seções da conta" className="mb-8 border-b">
          <ul className="-mb-px flex flex-wrap gap-x-4 gap-y-2 text-sm sm:gap-x-6">
            {TABS.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'inline-block border-b-2 pb-3 transition-colors',
                      isActive
                        ? 'border-primary font-medium text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-6">{children}</div>
      </div>
    </AppShell>
  )
}
