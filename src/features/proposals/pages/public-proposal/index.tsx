import { useQuery } from '@tanstack/react-query'
import { Link2Off, ListTree, Printer, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { ApiError } from '@shared/api/http.client'
import { errorMessage } from '@shared/api/error-message.helper'
import { Brand } from '@shared/components/brand'
import { Button } from '@shared/components/ui/button'
import { Skeleton } from '@shared/components/ui/skeleton'
import { formatDate } from '@shared/helpers/date.helper'
import { MarkdownView } from '@features/proposals/components/markdown-view'
import { extractSections } from '@features/proposals/markdown.helper'
import { proposalKeys, publicApi } from '@features/proposals/proposal.api'
import type { SharedProposal } from '@features/proposals/proposal.type'

function useReadingProgress(): number {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return progress
}

function Header({ onPrint }: { onPrint?: () => void }) {
  const progress = useReadingProgress()
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Brand />
        {onPrint && (
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer />
            Imprimir / PDF
          </Button>
        )}
      </div>
      {onPrint && (
        <div
          aria-hidden
          className="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-blue-500 to-violet-500 transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      )}
    </header>
  )
}

function Unavailable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const gone = error instanceof ApiError && error.status === 404
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border">
        <Link2Off className="size-5" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">
        {gone ? 'Este link não está disponível' : 'Não foi possível abrir a proposta'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {gone
          ? 'O link pode ter expirado ou sido revogado. Peça um novo link a quem enviou a proposta.'
          : errorMessage(error)}
      </p>
      {!gone && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          <RefreshCw />
          Tentar novamente
        </Button>
      )}
    </main>
  )
}

function Proposal({ proposal }: { proposal: SharedProposal }) {
  const sections = extractSections(proposal.content)

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-12 pb-20 print:max-w-none print:p-0">
      <div className="mb-10 max-w-3xl print:mb-6">
        <p className="text-xs font-medium tracking-widest text-primary uppercase print:text-black">
          Proposta comercial
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {proposal.title}
        </h1>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Preparada para</dt>
            <dd className="font-medium">{proposal.client_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Atualizada em</dt>
            <dd className="font-medium">
              <time dateTime={proposal.updated_at}>{formatDate(proposal.updated_at)}</time>
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] print:block">
        <article className="overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] dark:shadow-none print:rounded-none print:border-0 print:shadow-none">
          <div
            aria-hidden
            className="h-1 bg-linear-to-r from-blue-500 via-violet-500 to-blue-500 print:hidden"
          />
          <div className="px-6 py-8 sm:px-12 sm:py-12 print:p-0">
            <MarkdownView content={proposal.content} />
          </div>
        </article>

        {sections.length > 0 && (
          <nav aria-label="Sumário" className="hidden lg:sticky lg:top-24 lg:block print:hidden">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <ListTree className="size-4 text-muted-foreground" />
              Nesta proposta
            </h2>
            <ol className="space-y-0.5 border-l">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    {section.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </main>
  )
}

export function PublicProposalPage() {
  const { token = '' } = useParams()
  const query = useQuery({
    queryKey: proposalKeys.shared(token),
    queryFn: () => publicApi.get(token),
    retry: false,
  })

  return (
    <div className="flex min-h-svh flex-col bg-background print:block print:min-h-0 print:bg-white">
      <title>
        {query.data ? `${query.data.title} · Proposta comercial` : 'Proposta comercial'}
      </title>
      {/* The token is in the URL: keep it out of search engines and of the Referer sent to links in the proposal. */}
      <meta name="robots" content="noindex, nofollow" />
      <meta name="referrer" content="no-referrer" />

      <Header onPrint={query.isSuccess ? () => window.print() : undefined} />

      {query.isPending ? (
        <div
          aria-label="Carregando proposta"
          className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-6 pt-12"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-8 h-96 w-full max-w-4xl" />
        </div>
      ) : query.isError ? (
        <Unavailable error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Proposal proposal={query.data} />
      )}

      <footer className="border-t print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground">
          <span>Enviada com Silver Proposals</span>
          <span>Este link é pessoal. Evite encaminhá-lo.</span>
        </div>
      </footer>
    </div>
  )
}
