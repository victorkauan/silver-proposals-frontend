import type { UseQueryResult } from '@tanstack/react-query'
import { ChevronRight, FileText, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { errorMessage } from '@shared/api/error-message.helper'
import { Alert, AlertAction, AlertDescription } from '@shared/components/ui/alert'
import { Badge } from '@shared/components/ui/badge'
import { Button, buttonVariants } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Skeleton } from '@shared/components/ui/skeleton'
import { cn } from '@shared/helpers/cn.helper'
import { formatDateTime, formatRelative } from '@shared/helpers/date.helper'
import { initials } from '@shared/helpers/initials.helper'
import type { ProposalPage, ProposalRole } from '@features/proposals/proposal.type'

const ROLE_LABEL: Record<ProposalRole, string | null> = {
  owner: null,
  editor: 'Editor',
  viewer: 'Leitor',
}

const TONES = [
  'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
]

function toneFor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function EmptyState() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-6 py-16 text-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent)]"
      />
      <div className="relative mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
        <FileText className="size-5" />
      </div>
      <h3 className="relative text-sm font-medium">Nenhuma proposta ainda</h3>
      <p className="relative mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
        Descreva o cliente e o escopo em um briefing, e a IA escreve a primeira versão.
      </p>
      <Link to="/propostas/nova" className={buttonVariants({ className: 'relative' })}>
        <Plus />
        Criar primeira proposta
      </Link>
    </div>
  )
}

export function ProposalList({ query }: { query: UseQueryResult<ProposalPage> }) {
  const [search, setSearch] = useState('')

  if (query.isPending) {
    return (
      <div aria-label="Carregando propostas" className="space-y-2">
        <Skeleton className="h-8 w-64" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{errorMessage(query.error)}</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  if (query.data.items.length === 0) return <EmptyState />

  const term = normalize(search.trim())
  const items = term
    ? query.data.items.filter((proposal) =>
        normalize(`${proposal.title} ${proposal.client_name}`).includes(term),
      )
    : query.data.items

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar propostas"
          placeholder="Buscar por título ou cliente"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-8"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[minmax(0,1fr)_12rem_8rem_1rem] gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>Proposta</span>
          <span>Cliente</span>
          <span>Atualizada</span>
          <span />
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma proposta encontrada para “{search.trim()}”.
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((proposal) => {
              const role = ROLE_LABEL[proposal.role]
              return (
                <li key={proposal.id}>
                  <Link
                    to={`/propostas/${proposal.id}`}
                    className="group grid grid-cols-[minmax(0,1fr)_1rem] items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:grid-cols-[minmax(0,1fr)_12rem_8rem_1rem]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                          toneFor(proposal.client_name),
                        )}
                      >
                        {initials(proposal.client_name)}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{proposal.title}</span>
                          {role && <Badge variant="secondary">{role}</Badge>}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground sm:hidden">
                          {proposal.client_name} · {formatRelative(proposal.updated_at)}
                        </span>
                      </span>
                    </span>
                    <span className="hidden truncate text-sm text-muted-foreground sm:block">
                      {proposal.client_name}
                    </span>
                    <time
                      dateTime={proposal.updated_at}
                      title={formatDateTime(proposal.updated_at)}
                      className="hidden text-sm text-muted-foreground sm:block"
                    >
                      {formatRelative(proposal.updated_at)}
                    </time>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
