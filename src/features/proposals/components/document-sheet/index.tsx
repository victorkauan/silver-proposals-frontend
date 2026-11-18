import type { ReactNode } from 'react'

import { cn } from '@shared/helpers/cn.helper'

type Meta = { label: string; value: ReactNode }

export function DocumentSheet({
  meta,
  children,
  className,
}: {
  meta: Meta[]
  children: ReactNode
  className?: string
}) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] dark:shadow-none',
        className,
      )}
    >
      <div aria-hidden className="h-1 bg-linear-to-r from-blue-500 via-violet-500 to-blue-500" />
      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b bg-muted/30 px-6 py-4 sm:px-12">
        {meta.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {label}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="px-6 py-8 sm:px-12 sm:py-12">{children}</div>
    </article>
  )
}
