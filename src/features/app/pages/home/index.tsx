import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Clock3,
  FilePlus2,
  FileText,
  History,
  Link2,
  Plus,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { errorMessage } from '@shared/api/error-message.helper'
import { Alert, AlertAction, AlertDescription } from '@shared/components/ui/alert'
import { Badge } from '@shared/components/ui/badge'
import { Button, buttonVariants } from '@shared/components/ui/button'
import { Skeleton } from '@shared/components/ui/skeleton'
import { formatDateTime, formatRelative } from '@shared/helpers/date.helper'
import { AppShell } from '@features/app/components/app-shell'
import {
  type ActivityKind,
  type DashboardSummary,
  getDashboard,
  type ProposalStatus,
} from '@features/app/dashboard.api'
import { useSession } from '@features/auth/session.context'
import { proposalKeys } from '@features/proposals/proposal.api'
import { PROPOSAL_STATUS_LABEL } from '@features/proposals/proposal-status.constant'

const STATUS_LABELS: Record<ProposalStatus, string> = PROPOSAL_STATUS_LABEL

const STATUS_ORDER = ['draft', 'generated', 'edited', 'shared', 'archived'] as const
const STATUS_COLORS = {
  draft: 'bg-muted-foreground/45',
  generated: 'bg-primary/50',
  edited: 'bg-primary/75',
  shared: 'bg-primary',
  archived: 'bg-muted-foreground/25',
}

const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  generated: 'Proposta gerada',
  edited: 'Versão editada',
  restored: 'Versão restaurada',
  link_created: 'Link criado',
  link_revoked: 'Link revogado',
}

function Panel({
  id,
  title,
  tools,
  children,
}: {
  id: string
  title: string
  tools?: ReactNode
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-xl border bg-card">
      <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
        <h2 id={id} className="text-sm font-semibold">
          {title}
        </h2>
        {tools}
      </header>
      {children}
    </section>
  )
}

function EmptyPanel({ icon: Icon, children }: { icon: typeof Link2; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted-foreground sm:px-5">
      <Icon aria-hidden className="size-4 shrink-0" />
      <p>{children}</p>
    </div>
  )
}

function Indicators({ summary, total }: { summary: DashboardSummary; total: number }) {
  const metrics = [
    { title: 'Propostas', value: total, note: 'Inclui arquivadas', icon: FileText },
    {
      title: 'Gerações com IA',
      value: summary.generations_last_30_days,
      note: 'Suas gerações nos últimos 30 dias',
      icon: Sparkles,
    },
    {
      title: 'Links ativos',
      value: summary.active_link_count,
      note: 'Em propostas que você possui',
      icon: Link2,
    },
    {
      title: 'Links a vencer',
      value: summary.expiring_link_count,
      note: 'Nos próximos 7 dias',
      icon: Clock3,
    },
  ]
  return (
    <dl aria-label="Indicadores" className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
      {metrics.map(({ title, value, note, icon: Icon }) => (
        <div key={title} className="flex min-w-0 flex-col rounded-xl border bg-card p-3 sm:p-4">
          <dt className="flex items-center justify-between gap-1 text-xs font-medium text-muted-foreground sm:text-sm">
            {title}
            <Icon aria-hidden className="size-4 shrink-0 text-primary" />
          </dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {value}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground">{note}</dd>
        </div>
      ))}
    </dl>
  )
}

function StatusOverview({
  counts,
  total,
}: {
  counts: DashboardSummary['proposal_counts']
  total: number
}) {
  return (
    <section aria-labelledby="proposal-status" className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 id="proposal-status" className="text-sm font-semibold">
        Propostas por situação
      </h2>
      <div aria-hidden className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
        {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
          <span
            key={status}
            className={STATUS_COLORS[status]}
            style={{ flex: counts[status] / total }}
          />
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2 rounded-full ${STATUS_COLORS[status]}`} />
            <dt>{STATUS_LABELS[status]}</dt>
            <dd className="font-semibold text-foreground tabular-nums">{counts[status]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Dashboard({ summary }: { summary: DashboardSummary }) {
  const total = STATUS_ORDER.reduce((sum, status) => sum + summary.proposal_counts[status], 0)

  return (
    <div className="space-y-4">
      {total === 0 && (
        <section
          aria-labelledby="start-dashboard"
          className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <FilePlus2 aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1 basis-48">
            <h2 id="start-dashboard" className="text-base font-semibold">
              Nenhuma proposta ainda
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece pelo briefing. Depois de gerar a proposta, você pode revisar o texto e
              compartilhar um link.
            </p>
          </div>
          <Link to="/propostas/nova" className={buttonVariants()}>
            Criar primeira proposta <ArrowRight />
          </Link>
        </section>
      )}
      <Indicators summary={summary} total={total} />
      {total > 0 && <StatusOverview counts={summary.proposal_counts} total={total} />}
      <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-4">
          <Panel
            id="recent-proposals"
            title="Propostas recentes"
            tools={
              <Link
                to="/propostas"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver todas <ArrowRight aria-hidden className="size-3" />
              </Link>
            }
          >
            {summary.recent_proposals.length === 0 ? (
              <EmptyPanel icon={FileText}>
                As propostas que você pode acessar aparecem aqui.
              </EmptyPanel>
            ) : (
              <ul className="divide-y">
                {summary.recent_proposals.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/propostas/${item.id}`}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 sm:px-5"
                    >
                      <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:text-primary">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.client_name} ·{' '}
                          <time title={formatDateTime(item.updated_at)} dateTime={item.updated_at}>
                            {formatRelative(item.updated_at)}
                          </time>
                          {item.role !== 'owner' && (
                            <> · {item.role === 'editor' ? 'Editor' : 'Leitor'}</>
                          )}
                        </span>
                      </span>
                      <Badge variant={item.status === 'shared' ? 'default' : 'secondary'}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel id="active-links" title="Links de compartilhamento">
            {summary.active_links.length === 0 ? (
              <EmptyPanel icon={Link2}>Nenhum link ativo em propostas que você possui.</EmptyPanel>
            ) : (
              <ul className="divide-y">
                {summary.active_links.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/propostas/${item.proposal_id}`}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 sm:px-5"
                    >
                      <Link2 aria-hidden className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:text-primary">
                          {item.proposal_title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Expira em{' '}
                          <time dateTime={item.expires_at}>{formatDateTime(item.expires_at)}</time>
                        </span>
                      </span>
                      <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel id="recent-activity" title="Atividade recente">
          {summary.recent_activity.length === 0 ? (
            <EmptyPanel icon={History}>Versões e alterações em links aparecem aqui.</EmptyPanel>
          ) : (
            <ul className="divide-y">
              {summary.recent_activity.map((item) => (
                <li key={`${item.kind}-${item.event_id}`}>
                  <Link
                    to={`/propostas/${item.proposal_id}`}
                    className="group flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 sm:px-5"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/70"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium group-hover:text-primary">
                        {ACTIVITY_LABELS[item.kind]}
                        {item.version !== null && (
                          <span className="text-xs font-normal text-muted-foreground">
                            {' '}
                            · v{item.version}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.proposal_title}
                      </span>
                    </span>
                    <time
                      className="shrink-0 text-xs text-muted-foreground"
                      title={formatDateTime(item.occurred_at)}
                      dateTime={item.occurred_at}
                    >
                      {formatRelative(item.occurred_at)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

export function HomePage() {
  const { user } = useSession()
  const query = useQuery({
    queryKey: [...proposalKeys.dashboard(), user?.id],
    queryFn: getDashboard,
  })

  return (
    <AppShell page="Início">
      <div className="@container mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Olá, {user?.name.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe suas propostas, links e atividades.
            </p>
          </div>
          {query.data?.recent_proposals.length !== 0 && (
            <Link to="/propostas/nova" className={buttonVariants()}>
              <Plus /> Nova proposta
            </Link>
          )}
        </div>
        {query.isPending && (
          <div role="status" aria-label="Carregando painel" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
              {STATUS_ORDER.slice(0, 4).map((status) => (
                <Skeleton key={status} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-56" />
          </div>
        )}
        {query.isError && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(query.error)}</AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                Tentar novamente
              </Button>
            </AlertAction>
          </Alert>
        )}
        {query.data && <Dashboard summary={query.data} />}
      </div>
    </AppShell>
  )
}
