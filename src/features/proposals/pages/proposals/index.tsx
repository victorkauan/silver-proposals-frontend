import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { buttonVariants } from '@shared/components/ui/button'
import { AppShell } from '@features/app/components/app-shell'
import { ProposalList } from '@features/proposals/components/proposal-list'
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  proposalApi,
  proposalKeys,
} from '@features/proposals/proposal.api'

const SEARCH_DELAY_MS = 300

export function ProposalsPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = Math.max(1, Math.floor(Number(params.get('pagina'))) || 1)
  const requested = Number(params.get('por_pagina'))
  const size = (PAGE_SIZES as readonly number[]).includes(requested) ? requested : DEFAULT_PAGE_SIZE
  const [search, setSearch] = useState(q)

  const query = useQuery({
    queryKey: proposalKeys.list({ q: q.trim(), page, size }),
    queryFn: () => proposalApi.list({ q: q.trim(), page, size }),
    placeholderData: keepPreviousData,
  })

  const update = (next: { q?: string; page?: number; size?: number }, replace = false) => {
    const nextQ = next.q ?? q
    const nextPage = next.page ?? page
    const nextSize = next.size ?? size
    const entries: Record<string, string> = {}
    if (nextQ.trim()) entries.q = nextQ
    if (nextPage > 1) entries.pagina = String(nextPage)
    if (nextSize !== DEFAULT_PAGE_SIZE) entries.por_pagina = String(nextSize)
    setParams(entries, { replace })
  }

  useEffect(() => {
    if (search === q) return
    const timer = setTimeout(() => update({ q: search, page: 1 }, true), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  })

  const total = query.data?.total ?? 0
  const lastPage = Math.max(1, Math.ceil(total / size))
  useEffect(() => {
    if (query.isSuccess && !query.isPlaceholderData && page > lastPage) {
      update({ page: lastPage }, true)
    }
  })

  const hasProposals = total > 0 || q.trim() !== ''

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
            {q.trim() ? 'Resultados da busca' : 'Suas propostas'}
            {query.data && hasProposals && (
              <span className="font-normal text-muted-foreground tabular-nums">{total}</span>
            )}
          </h2>
          <ProposalList
            query={query}
            search={search}
            onSearchChange={setSearch}
            page={page}
            onPageChange={(next) => {
              update({ page: next })
              window.scrollTo({ top: 0 })
            }}
            pageSize={size}
            onPageSizeChange={(next) => update({ size: next, page: 1 })}
          />
        </section>
      </div>
    </AppShell>
  )
}
