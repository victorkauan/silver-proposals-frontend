import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileDiff, FileText, History, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { errorMessage } from '@shared/api/error-message.helper'
import { Alert, AlertAction, AlertDescription } from '@shared/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import { Skeleton } from '@shared/components/ui/skeleton'
import { Spinner } from '@shared/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@shared/components/ui/toggle-group'
import { cn } from '@shared/helpers/cn.helper'
import { formatDate, formatDateTime, formatRelative } from '@shared/helpers/date.helper'
import { AppShell } from '@features/app/components/app-shell'
import { DocumentSheet } from '@features/proposals/components/document-sheet'
import { MarkdownView } from '@features/proposals/components/markdown-view'
import { VersionDiff } from '@features/proposals/components/version-diff'
import { proposalApi, proposalKeys } from '@features/proposals/proposal.api'
import type { ProposalDetail, VersionSummary } from '@features/proposals/proposal.type'
import { VERSION_SOURCE } from '@features/proposals/version-source.constant'

type Mode = 'document' | 'changes'

export function ProposalHistoryPage() {
  const { id = '' } = useParams()
  const proposal = useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => proposalApi.get(id),
  })
  const versions = useQuery({
    queryKey: proposalKeys.versions(id),
    queryFn: () => proposalApi.versions(id),
  })
  const parents = [
    { label: 'Propostas', to: '/propostas' },
    { label: proposal.data?.title ?? 'Proposta', to: `/propostas/${id}` },
  ]

  const failed = proposal.isError ? proposal : versions.isError ? versions : null
  let body
  if (proposal.isPending || versions.isPending) {
    body = (
      <div
        aria-label="Carregando histórico"
        className="grid gap-6 @4xl:grid-cols-[18rem_minmax(0,1fr)]"
      >
        <Skeleton className="h-72" />
        <Skeleton className="h-96" />
      </div>
    )
  } else if (failed) {
    body = (
      <Alert variant="destructive">
        <AlertDescription>{errorMessage(failed.error)}</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline" onClick={() => failed.refetch()}>
            Tentar novamente
          </Button>
        </AlertAction>
      </Alert>
    )
  } else if (versions.data!.items.length === 0) {
    body = (
      <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <History className="size-5" />
        </div>
        <h2 className="text-sm font-medium">Nenhuma versão ainda</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Cada geração, edição salva ou restauração cria uma versão aqui.
        </p>
      </div>
    )
  } else {
    body = <VersionHistory proposal={proposal.data!} versions={versions.data!.items} />
  }

  return (
    <AppShell page="Histórico" parents={parents}>
      <div className="@container mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Histórico de versões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare as alterações e restaure qualquer versão. Restaurar nunca apaga o histórico.
          </p>
        </div>
        {body}
      </div>
    </AppShell>
  )
}

function VersionHistory({
  proposal,
  versions,
}: {
  proposal: ProposalDetail
  versions: VersionSummary[]
}) {
  const [params, setParams] = useSearchParams()
  const requested = Number(params.get('versao'))
  const selected = versions.find((version) => version.number === requested) ?? versions[0]
  const previous = versions.find((version) => version.number < selected.number)
  const [mode, setMode] = useState<Mode>('document')
  const canRestore = proposal.role !== 'viewer' && selected.number !== proposal.version

  return (
    <div className="grid items-start gap-6 @4xl:grid-cols-[18rem_minmax(0,1fr)]">
      <nav
        aria-label="Versões"
        className="overflow-hidden rounded-xl border bg-card @4xl:sticky @4xl:top-20"
      >
        <ol className="max-h-[70vh] divide-y overflow-y-auto">
          {versions.map((version) => {
            const source = VERSION_SOURCE[version.source]
            const Icon = source.icon
            const active = version.number === selected.number
            return (
              <li key={version.number}>
                <button
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => setParams({ versao: String(version.number) }, { replace: true })}
                  className={cn(
                    'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    active && 'bg-primary/5 shadow-[inset_2px_0_0_var(--primary)]',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                      source.tone,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      Versão {version.number}
                      {version.number === proposal.version && (
                        <Badge variant="secondary">Atual</Badge>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {source.label}
                      {version.author_name && ` por ${version.author_name}`}
                    </span>
                    <time
                      dateTime={version.created_at}
                      title={formatDateTime(version.created_at)}
                      className="block text-xs text-muted-foreground"
                    >
                      {formatRelative(version.created_at)}
                    </time>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <VersionPanel
        proposal={proposal}
        version={selected}
        previous={previous}
        mode={mode}
        onModeChange={setMode}
        canRestore={canRestore}
      />
    </div>
  )
}

function VersionPanel({
  proposal,
  version,
  previous,
  mode,
  onModeChange,
  canRestore,
}: {
  proposal: ProposalDetail
  version: VersionSummary
  previous: VersionSummary | undefined
  mode: Mode
  onModeChange: (mode: Mode) => void
  canRestore: boolean
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const current = useQuery({
    queryKey: proposalKeys.version(proposal.id, version.number),
    queryFn: () => proposalApi.version(proposal.id, version.number),
  })
  const before = useQuery({
    queryKey: proposalKeys.version(proposal.id, previous?.number ?? 0),
    queryFn: () => proposalApi.version(proposal.id, previous!.number),
    enabled: mode === 'changes' && !!previous,
  })
  const restore = useMutation({
    mutationFn: () => proposalApi.restore(proposal.id, version.number),
    onSuccess: async (restored) => {
      void queryClient.invalidateQueries({ queryKey: proposalKeys.dashboard() })
      queryClient.setQueryData(proposalKeys.detail(restored.id), restored)
      await queryClient.invalidateQueries({ queryKey: proposalKeys.list() })
      await queryClient.invalidateQueries({ queryKey: proposalKeys.versions(restored.id) })
      toast.success(`Versão ${version.number} restaurada`, {
        description: `Agora ela é a versão ${restored.version}.`,
      })
      navigate(`/propostas/${restored.id}`)
    },
    onError: (error) =>
      toast.error('Não foi possível restaurar', { description: errorMessage(error) }),
  })
  const source = VERSION_SOURCE[version.source]

  let content
  if (current.isPending || (mode === 'changes' && previous && before.isPending)) {
    content = <Skeleton className="h-96" />
  } else if (current.isError || before.isError) {
    content = (
      <Alert variant="destructive">
        <AlertDescription>{errorMessage(current.error ?? before.error)}</AlertDescription>
      </Alert>
    )
  } else if (mode === 'changes') {
    content = (
      <VersionDiff
        before={previous ? (before.data?.content ?? '') : ''}
        after={current.data.content}
      />
    )
  } else {
    content = (
      <DocumentSheet
        meta={[
          { label: 'Versão', value: `v${version.number}` },
          { label: 'Origem', value: source.label },
          { label: 'Data', value: formatDate(version.created_at) },
        ]}
      >
        {current.data.content.trim() ? (
          <MarkdownView content={current.data.content} />
        ) : (
          <p className="text-sm text-muted-foreground">Esta versão está vazia.</p>
        )}
      </DocumentSheet>
    )
  }

  return (
    <section aria-label={`Versão ${version.number}`} className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Versão {version.number}</h2>
          <p className="text-sm text-muted-foreground">
            {source.label}
            {version.author_name && ` por ${version.author_name}`} ·{' '}
            {formatDateTime(version.created_at)} · {version.content_chars.toLocaleString('pt-BR')}{' '}
            caracteres
          </p>
        </div>
        <ToggleGroup
          aria-label="Exibir"
          value={[mode]}
          onValueChange={(values) => values[0] && onModeChange(values[0] as Mode)}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem value="document">
            <FileText /> Documento
          </ToggleGroupItem>
          <ToggleGroupItem value="changes">
            <FileDiff /> Alterações
          </ToggleGroupItem>
        </ToggleGroup>
        {canRestore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
            disabled={restore.isPending}
          >
            {restore.isPending ? <Spinner /> : <RotateCcw />}
            Restaurar esta versão
          </Button>
        )}
      </div>
      {mode === 'changes' && (
        <p className="text-xs text-muted-foreground">
          {previous
            ? `Comparada com a versão ${previous.number}.`
            : 'Primeira versão: todo o conteúdo é novo.'}
        </p>
      )}
      {content}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar a versão {version.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              O conteúdo dela vira a versão {proposal.version + 1}. A versão atual (
              {proposal.version}) continua salva no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => restore.mutate()}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
