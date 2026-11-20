import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Brand } from '@shared/components/brand'
import { BrandPanel } from '@features/auth/components/brand-panel'

type AuthLayoutProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <Link to="/" className="self-center md:self-start" aria-label="Silver Proposals">
          <Brand />
        </Link>
        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-balance text-muted-foreground">{description}</p>
            </div>
            {children}
            {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
          </div>
        </main>
      </div>
      <BrandPanel />
    </div>
  )
}
