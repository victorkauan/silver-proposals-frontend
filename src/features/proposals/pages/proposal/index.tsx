import { useQuery } from '@tanstack/react-query'
import { FileText, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { ApiError } from '@shared/api/http.client'
import { errorMessage } from '@shared/api/error-message.helper'
import { FormError } from '@shared/components/form-error'
import { Alert, AlertAction, AlertDescription } from '@shared/components/ui/alert'
import { Badge } from '@shared/components/ui/badge'
import { Button, buttonVariants } from '@shared/components/ui/button'
import { Skeleton } from '@shared/components/ui/skeleton'
import { formatDate, formatRelative } from '@shared/helpers/date.helper'
import { AppShell } from '@features/app/components/app-shell'
import { DocumentSheet } from '@features/proposals/components/document-sheet'
import { GenerationPreview } from '@features/proposals/components/generation-preview'
import { MarkdownView } from '@features/proposals/components/markdown-view'
import { ProposalOutline } from '@features/proposals/components/proposal-outline'
import { proposalApi, proposalKeys } from '@features/proposals/proposal.api'
import type { ProposalDetail } from '@features/proposals/proposal.type'
import { useGeneration } from '@features/proposals/use-generation.hook'

const PARENTS = [{ label: 'Propostas', to: '/' }]

export function ProposalPage() {
  const { id = '' } = useParams()
  const query = useQuery({ queryKey: proposalKeys.detail(id), queryFn: () => proposalApi.get(id) })

  if (query.isPending) {
    return (
      <AppShell page="Proposta" parents={PARENTS}>
        <div
          aria-label="Carregando proposta"
          className="mx-auto w-full max-w-6xl space-y-4 px-6 py-10"
        >
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    )
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404
    return (
      <AppShell page="Proposta" parents={PARENTS}>
        <div className="@container mx-auto w-full max-w-6xl px-6 py-10">
          <Alert variant={notFound ? 'default' : 'destructive'}>
            <AlertDescription>
              {notFound ? 'Proposta não encontrada.' : errorMessage(query.error)}
            </AlertDescription>
            <AlertAction>
              {notFound ? (
                <Link to="/" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                  Voltar às propostas
                </Link>
              ) : (
                <Button size="sm" variant="outline" onClick={() => query.refetch()}>
                  Tentar novamente
                </Button>
              )}
            </AlertAction>
          </Alert>
        </div>
      </AppShell>
    )
  }

  return <ProposalView proposal={query.data} />
}

function ProposalView({ proposal }: { proposal: ProposalDetail }) {
  const generation = useGeneration()
  const generating = generation.status === 'streaming'
  const canGenerate = proposal.role !== 'viewer' && proposal.briefing.trim() !== ''
  const hasContent = proposal.content.trim() !== ''
  const meta = [
    { label: 'Cliente', value: proposal.client_name },
    { label: 'Data', value: formatDate(proposal.updated_at) },
    { label: 'Versão', value: proposal.version ? `v${proposal.version}` : '—' },
  ]

  return (
    <AppShell page={proposal.title} parents={PARENTS}>
      <div className="@container mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={hasContent ? 'secondary' : 'outline'}>
                {hasContent ? 'Rascunho' : 'Sem conteúdo'}
              </Badge>
              {proposal.version > 0 && (
                <Badge variant="outline" className="tabular-nums">
                  Versão {proposal.version}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight break-words">{proposal.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {proposal.client_name} · atualizada {formatRelative(proposal.updated_at)}
            </p>
          </div>
          {canGenerate && hasContent && !generating && (
            <Button variant="outline" onClick={() => void generation.generate(proposal.id)}>
              <Sparkles />
              Gerar novamente
            </Button>
          )}
        </header>

        <FormError message={generation.error} />
        <div className={generation.error ? 'mt-4' : undefined}>
          {generating ? (
            <GenerationPreview text={generation.text} meta={meta} onStop={generation.reset} />
          ) : hasContent ? (
            <div className="grid items-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_16rem]">
              <DocumentSheet meta={meta}>
                <MarkdownView content={proposal.content} />
              </DocumentSheet>
              <ProposalOutline proposal={proposal} />
            </div>
          ) : (
            <div className="grid items-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <FileText className="size-5" />
                </div>
                <h2 className="text-sm font-medium">Esta proposta ainda não tem conteúdo</h2>
                <p className="mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
                  {canGenerate
                    ? 'Gere a primeira versão a partir do briefing.'
                    : 'O conteúdo aparecerá aqui quando for escrito.'}
                </p>
                {canGenerate && (
                  <Button onClick={() => void generation.generate(proposal.id)}>
                    <Sparkles />
                    Gerar com IA
                  </Button>
                )}
              </div>
              <ProposalOutline proposal={proposal} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
