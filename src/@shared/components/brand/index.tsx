import { FileText } from 'lucide-react'

import { cn } from '@shared/helpers/cn.helper'

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-sm ring-1 ring-black/5 ring-inset',
        className,
      )}
    >
      <FileText className="size-4" />
    </div>
  )
}

export function Brand() {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
      <BrandMark />
      Silver Proposals
    </span>
  )
}
