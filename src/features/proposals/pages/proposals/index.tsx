import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'

import { buttonVariants } from '@shared/components/ui/button'
import { AppShell } from '@features/app/components/app-shell'
import { ProposalList } from '@features/proposals/components/proposal-list'
import { proposalApi, proposalKeys } from '@features/proposals/proposal.api'

export function ProposalsPage() {
  const query = useQuery({ queryKey: proposalKeys.list(), queryFn: proposalApi.list })
  const hasProposals = !!query.data?.items.length

  return (
    <AppShell page="Propostas">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Busque por título ou cliente.</p>
          </div>
          {hasProposals && (
            <Link to="/propostas/nova" className={buttonVariants()}>
              <Plus /> Nova proposta
            </Link>
          )}
        </div>
        <section aria-labelledby="proposal-list">
          <h2 id="proposal-list" className="mb-3 flex items-baseline gap-2 text-sm font-medium">
            Suas propostas
            {hasProposals && (
              <span className="font-normal text-muted-foreground">{query.data?.total}</span>
            )}
          </h2>
          <ProposalList query={query} />
        </section>
      </div>
    </AppShell>
  )
}
