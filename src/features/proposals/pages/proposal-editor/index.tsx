import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bold,
  Columns2,
  Eye,
  Heading2,
  Italic,
  List,
  ListOrdered,
  PenLine,
  Quote,
  Save,
  SearchCheck,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useBlocker, useParams } from 'react-router'
import { toast } from 'sonner'

import { ApiError } from '@shared/api/http.client'
import { errorMessage } from '@shared/api/error-message.helper'
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
import { Alert, AlertAction, AlertDescription } from '@shared/components/ui/alert'
import { Button } from '@shared/components/ui/button'
import { Separator } from '@shared/components/ui/separator'
import { Skeleton } from '@shared/components/ui/skeleton'
import { Spinner } from '@shared/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@shared/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/components/ui/tooltip'
import { cn } from '@shared/helpers/cn.helper'
import { formatDate, formatRelative } from '@shared/helpers/date.helper'
import { AppShell } from '@features/app/components/app-shell'
import { DocumentSheet } from '@features/proposals/components/document-sheet'
import { MarkdownView } from '@features/proposals/components/markdown-view'
import {
  countWords,
  nextPlaceholder,
  prefixLines,
  type TextEdit,
  wrapSelection,
} from '@features/proposals/editor.helper'
import { countPlaceholders, PLACEHOLDER } from '@features/proposals/markdown.helper'
import { CONTENT_MAX_LENGTH, proposalApi, proposalKeys } from '@features/proposals/proposal.api'
import type { ProposalDetail } from '@features/proposals/proposal.type'

type View = 'edit' | 'split' | 'preview'

const CONFLICT_CODE = 'version_conflict'

export function ProposalEditorPage() {
  const { id = '' } = useParams()
  const query = useQuery({ queryKey: proposalKeys.detail(id), queryFn: () => proposalApi.get(id) })
  const parents = [
    { label: 'Propostas', to: '/propostas' },
    { label: query.data?.title ?? 'Proposta', to: `/propostas/${id}` },
  ]

  if (query.isPending) {
    return (
      <AppShell page="Editar" parents={parents}>
        <div aria-label="Carregando editor" className="grid flex-1 gap-4 p-6 @5xl:grid-cols-2">
          <Skeleton className="h-[60vh]" />
          <Skeleton className="h-[60vh]" />
        </div>
      </AppShell>
    )
  }

  if (query.isError) {
    return (
      <AppShell page="Editar" parents={parents}>
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(query.error)}</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="outline" onClick={() => query.refetch()}>
                Tentar novamente
              </Button>
            </AlertAction>
          </Alert>
        </div>
      </AppShell>
    )
  }

  if (query.data.role === 'viewer') return <Navigate to={`/propostas/${id}`} replace />

  return (
    <AppShell page="Editar" parents={parents}>
      <Editor key={query.data.id} proposal={query.data} />
    </AppShell>
  )
}

function ToolButton({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string
  shortcut?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && (
          <kbd aria-hidden className="ml-2 font-mono text-[10px] opacity-70">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function SaveStatus({
  saving,
  dirty,
  failed,
  base,
}: {
  saving: boolean
  dirty: boolean
  failed: boolean
  base: ProposalDetail
}) {
  if (saving) {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Spinner className="size-3.5" /> Salvando…
      </span>
    )
  }
  if (failed && dirty) {
    return (
      <span className="flex items-center gap-1.5 text-destructive">
        <span className="size-1.5 rounded-full bg-destructive" /> Não foi possível salvar
      </span>
    )
  }
  if (dirty) {
    return (
      <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-500" /> Alterações não salvas
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      {base.version
        ? `Versão ${base.version} salva ${formatRelative(base.updated_at)}`
        : 'Sem conteúdo salvo'}
    </span>
  )
}

function Editor({ proposal }: { proposal: ProposalDetail }) {
  const queryClient = useQueryClient()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const [base, setBase] = useState(proposal)
  const [draft, setDraft] = useState(proposal.content)
  const [view, setView] = useState<View>('split')
  const [conflict, setConflict] = useState(false)
  const dirty = draft !== base.content
  const tooLong = draft.length > CONTENT_MAX_LENGTH
  const placeholders = countPlaceholders(draft)

  const save = useMutation({
    mutationFn: () => proposalApi.saveContent(base.id, draft, base.version),
    onSuccess: (saved) => {
      setBase(saved)
      void queryClient.invalidateQueries({ queryKey: proposalKeys.dashboard() })
      queryClient.setQueryData(proposalKeys.detail(saved.id), saved)
      void queryClient.invalidateQueries({ queryKey: proposalKeys.list() })
      void queryClient.invalidateQueries({ queryKey: proposalKeys.versions(saved.id) })
      toast.success('Proposta salva', { description: `Versão ${saved.version}` })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === CONFLICT_CODE) setConflict(true)
      else toast.error('Não foi possível salvar', { description: errorMessage(error) })
    },
  })

  const canSave = dirty && !tooLong && !save.isPending
  const submit = useCallback(() => {
    if (canSave) save.mutate()
  }, [canSave, save])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submit])

  useEffect(() => {
    if (!dirty) return
    const onUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  const blocker = useBlocker(dirty && !conflict)

  const apply = (edit: (value: string, start: number, end: number) => TextEdit) => {
    const element = textarea.current
    if (!element) return
    const result = edit(draft, element.selectionStart, element.selectionEnd)
    setDraft(result.value)
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  const jumpToPlaceholder = () => {
    const element = textarea.current
    if (!element) return
    if (view === 'preview') setView('split')
    const index = nextPlaceholder(draft, element.selectionEnd)
    if (index === -1) return
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(index, index + PLACEHOLDER.length)
      const line = draft.slice(0, index).split('\n').length
      element.scrollTop = Math.max(0, (line - 5) * 24)
    })
  }

  const reloadLatest = async () => {
    const latest = await queryClient.fetchQuery({
      queryKey: proposalKeys.detail(base.id),
      queryFn: () => proposalApi.get(base.id),
      staleTime: 0,
    })
    setBase(latest)
    setDraft(latest.content)
    setConflict(false)
    toast.info('Versão mais recente carregada', { description: `Versão ${latest.version}` })
  }

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft)
    toast.success('Seu texto foi copiado')
  }

  const showEditor = view !== 'preview'
  const showPreview = view !== 'edit'

  return (
    <div className="@container flex min-h-0 flex-1 flex-col">
      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-1 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <ToggleGroup
          aria-label="Modo de exibição"
          value={[view]}
          onValueChange={(values) => values[0] && setView(values[0] as View)}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem value="edit" aria-label="Só o editor">
            <PenLine /> <span className="hidden @3xl:inline">Editar</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="split" aria-label="Editor e visualização">
            <Columns2 /> <span className="hidden @3xl:inline">Dividir</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" aria-label="Só a visualização">
            <Eye /> <span className="hidden @3xl:inline">Visualizar</span>
          </ToggleGroupItem>
        </ToggleGroup>

        {showEditor && (
          <>
            <Separator
              orientation="vertical"
              className="mx-1 data-vertical:h-5 data-vertical:self-auto"
            />
            <ToolButton
              label="Título de seção"
              onClick={() => apply((v, s, e) => prefixLines(v, s, e, () => '## '))}
            >
              <Heading2 />
            </ToolButton>
            <ToolButton
              label="Negrito"
              onClick={() => apply((v, s, e) => wrapSelection(v, s, e, '**', 'negrito'))}
            >
              <Bold />
            </ToolButton>
            <ToolButton
              label="Itálico"
              onClick={() => apply((v, s, e) => wrapSelection(v, s, e, '_', 'itálico'))}
            >
              <Italic />
            </ToolButton>
            <ToolButton
              label="Lista"
              onClick={() => apply((v, s, e) => prefixLines(v, s, e, () => '- '))}
            >
              <List />
            </ToolButton>
            <ToolButton
              label="Lista numerada"
              onClick={() => apply((v, s, e) => prefixLines(v, s, e, (index) => `${index + 1}. `))}
            >
              <ListOrdered />
            </ToolButton>
            <ToolButton
              label="Citação"
              onClick={() => apply((v, s, e) => prefixLines(v, s, e, () => '> '))}
            >
              <Quote />
            </ToolButton>
          </>
        )}

        {placeholders > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={jumpToPlaceholder}
            className="ml-1 text-amber-700 hover:text-amber-800 dark:text-amber-400"
          >
            <SearchCheck />
            {placeholders === 1 ? '1 ponto a definir' : `${placeholders} pontos a definir`}
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3 text-xs">
          <span aria-live="polite" className="hidden @2xl:block">
            <SaveStatus saving={save.isPending} dirty={dirty} failed={save.isError} base={base} />
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!dirty || save.isPending}
            onClick={() => setDraft(base.content)}
          >
            Descartar
          </Button>
          <Button
            size="sm"
            disabled={!canSave}
            onClick={submit}
            aria-keyshortcuts="Control+S Meta+S"
          >
            {save.isPending ? <Spinner /> : <Save />}
            Salvar
            <kbd
              aria-hidden
              className="hidden rounded border border-primary-foreground/30 px-1 font-mono text-[10px] @3xl:inline"
            >
              Ctrl S
            </kbd>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'grid flex-1 bg-muted/30',
          showEditor && showPreview && '@5xl:grid-cols-2 @5xl:divide-x',
        )}
      >
        {showEditor && (
          <div className="flex min-h-[60vh] flex-col @5xl:h-[calc(100svh-7.5rem)]">
            <label htmlFor="content" className="sr-only">
              Conteúdo em Markdown
            </label>
            <textarea
              id="content"
              ref={textarea}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck
              placeholder={'# Proposta comercial\n\n## Resumo\nEscreva aqui em Markdown…'}
              aria-invalid={tooLong}
              className="flex-1 resize-none bg-background px-6 py-5 font-mono text-[13px] leading-6 outline-none placeholder:text-muted-foreground/60 @5xl:px-8"
            />
            <div className="flex items-center justify-between border-t bg-background px-6 py-1.5 text-xs text-muted-foreground tabular-nums">
              <span>{countWords(draft).toLocaleString('pt-BR')} palavras</span>
              <span className={cn(tooLong && 'font-medium text-destructive')}>
                {draft.length.toLocaleString('pt-BR')} /{' '}
                {CONTENT_MAX_LENGTH.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        )}
        {showPreview && (
          <section
            aria-label="Visualização"
            className="min-h-[60vh] overflow-y-auto px-4 py-6 @5xl:h-[calc(100svh-7.5rem)] @5xl:px-8"
          >
            <DocumentSheet
              className="mx-auto max-w-3xl"
              meta={[
                { label: 'Cliente', value: base.client_name },
                { label: 'Data', value: formatDate(base.updated_at) },
                {
                  label: 'Versão',
                  value: dirty ? 'Rascunho' : base.version ? `v${base.version}` : '—',
                },
              ]}
            >
              {draft.trim() ? (
                <MarkdownView content={draft} />
              ) : (
                <p className="text-sm text-muted-foreground">A visualização aparece aqui.</p>
              )}
            </DocumentSheet>
          </section>
        )}
      </div>

      <AlertDialog open={conflict} onOpenChange={setConflict}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>A proposta foi alterada por outra pessoa</AlertDialogTitle>
            <AlertDialogDescription>
              Alguém salvou uma versão mais nova enquanto você editava. Copie seu texto antes de
              carregar a versão mais recente, para não perder suas alterações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => void copyDraft()}>
              Copiar meu texto
            </Button>
            <AlertDialogAction onClick={() => void reloadLatest()}>
              Carregar versão mais recente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
