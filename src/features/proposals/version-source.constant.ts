import { PenLine, RotateCcw, Sparkles } from 'lucide-react'

import type { VersionSource } from '@features/proposals/proposal.type'

export const VERSION_SOURCE: Record<
  VersionSource,
  { label: string; icon: typeof Sparkles; tone: string }
> = {
  generated: {
    label: 'Gerada pela IA',
    icon: Sparkles,
    tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  edited: {
    label: 'Editada',
    icon: PenLine,
    tone: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  restored: {
    label: 'Restaurada',
    icon: RotateCcw,
    tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
}
