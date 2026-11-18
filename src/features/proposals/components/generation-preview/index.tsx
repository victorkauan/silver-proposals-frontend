import { Check, Circle, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@shared/components/ui/button'
import { Spinner } from '@shared/components/ui/spinner'
import { cn } from '@shared/helpers/cn.helper'
import { DocumentSheet } from '@features/proposals/components/document-sheet'
import { MarkdownView } from '@features/proposals/components/markdown-view'
import { extractSections } from '@features/proposals/markdown.helper'

type StepState = 'done' | 'active' | 'pending'

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-3" strokeWidth={3} />
      </span>
    )
  }
  if (state === 'active') {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30">
        <Spinner className="size-3" />
      </span>
    )
  }
  return (
    <span className="flex size-5 items-center justify-center text-muted-foreground/50">
      <Circle className="size-3" />
    </span>
  )
}

function useElapsed(): string {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

type GenerationPreviewProps = {
  text: string
  meta: Array<{ label: string; value: string }>
  onStop?: () => void
}

export function GenerationPreview({ text, meta, onStop }: GenerationPreviewProps) {
  const elapsed = useElapsed()
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => root.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), [])
  const sections = extractSections(text)
  const writing = text.length > 0
  const steps: Array<{ label: string; state: StepState }> = [
    { label: 'Briefing enviado', state: 'done' },
    { label: 'Estruturando a proposta', state: writing ? 'done' : 'active' },
    { label: 'Escrevendo as seções', state: writing ? 'active' : 'pending' },
    { label: 'Salvando a versão', state: 'pending' },
  ]

  return (
    <div
      ref={root}
      className="grid scroll-mt-20 items-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_16rem]"
    >
      <section aria-label="Proposta sendo gerada" aria-busy>
        <DocumentSheet meta={meta}>
          {writing ? (
            <MarkdownView content={text} />
          ) : (
            <div className="space-y-3" aria-hidden>
              <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            </div>
          )}
          <span
            aria-hidden
            className="mt-2 inline-block h-5 w-0.5 animate-pulse bg-primary align-middle"
          />
        </DocumentSheet>
      </section>

      <aside className="order-first rounded-xl border bg-card p-4 @4xl:sticky @4xl:top-20 @4xl:order-none">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">Gerando com IA</h2>
          <span
            className="font-mono text-xs text-muted-foreground tabular-nums"
            title="Tempo decorrido"
          >
            {elapsed}
          </span>
        </div>
        <ol className="space-y-3">
          {steps.map(({ label, state }) => (
            <li key={label}>
              <div className="flex items-center gap-2.5 text-sm">
                <StepIcon state={state} />
                <span className={cn(state === 'pending' && 'text-muted-foreground')}>{label}</span>
              </div>
              {label === 'Escrevendo as seções' && sections.length > 0 && (
                <ul aria-label="Seções escritas" className="mt-2 ml-2.5 space-y-1.5 border-l pl-4">
                  {sections.map((section, index) => (
                    <li
                      key={section.id}
                      className={cn(
                        'truncate text-xs',
                        index === sections.length - 1
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {section.text}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        {onStop && (
          <Button variant="outline" size="sm" className="mt-5 w-full" onClick={onStop}>
            <Square className="size-3 fill-current" />
            Parar geração
          </Button>
        )}
      </aside>
    </div>
  )
}
