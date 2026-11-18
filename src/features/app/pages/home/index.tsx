import { useQuery } from '@tanstack/react-query'
import { PenLine, Plus, Share2, Sparkles } from 'lucide-react'
import { Link } from 'react-router'

import { buttonVariants } from '@shared/components/ui/button'
import { cn } from '@shared/helpers/cn.helper'
import { AppShell } from '@features/app/components/app-shell'
import { useSession } from '@features/auth/session.context'
import { ProposalList } from '@features/proposals/components/proposal-list'
import { proposalApi, proposalKeys } from '@features/proposals/proposal.api'

const STEPS = [
  {
    icon: PenLine,
    title: 'Escreva o briefing',
    description: 'Descreva o cliente, o escopo e as restrições com suas palavras.',
    tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Sparkles,
    title: 'Gere com IA',
    description: 'A proposta é escrita em segundos, seção por seção, sem inventar valores.',
    tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    icon: Share2,
    title: 'Edite e compartilhe',
    description: 'Ajuste o texto com histórico de versões e envie um link seguro ao cliente.',
    tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
]

export function HomePage() {
  const { user } = useSession()
  const firstName = user?.name.split(' ')[0] ?? ''
  const query = useQuery({ queryKey: proposalKeys.list(), queryFn: proposalApi.list })
  const isEmpty = query.data?.items.length === 0

  return (
    <AppShell page="Propostas">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Olá, {firstName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe e gerencie suas propostas comerciais.
            </p>
          </div>
          {query.isSuccess && !isEmpty && (
            <Link to="/propostas/nova" className={buttonVariants()}>
              <Plus />
              Nova proposta
            </Link>
          )}
        </div>

        {isEmpty && (
          <section aria-labelledby="getting-started" className="mb-10">
            <h2 id="getting-started" className="mb-3 text-sm font-medium">
              Primeiros passos
            </h2>
            <ol className="grid gap-3 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, description, tone }, index) => (
                <li
                  key={title}
                  className="group relative rounded-lg border bg-card p-5 transition-colors hover:border-foreground/20"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={cn('flex size-9 items-center justify-center rounded-md', tone)}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="text-sm font-medium">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="proposals">
          <h2 id="proposals" className="mb-3 flex items-baseline gap-2 text-sm font-medium">
            Suas propostas
            {query.isSuccess && !isEmpty && (
              <span className="font-normal text-muted-foreground">{query.data.total}</span>
            )}
          </h2>
          <ProposalList query={query} />
        </section>
      </div>
    </AppShell>
  )
}
