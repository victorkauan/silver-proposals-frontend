import { ChevronDown, CircleAlert, ListTree } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/components/ui/collapsible'
import { formatDate, formatDateTime } from '@shared/helpers/date.helper'
import { countPlaceholders, extractSections } from '@features/proposals/markdown.helper'
import type { ProposalDetail } from '@features/proposals/proposal.type'

const ROLE: Record<ProposalDetail['role'], string> = {
  owner: 'Proprietário',
  editor: 'Editor',
  viewer: 'Leitor',
}

export function ProposalOutline({ proposal }: { proposal: ProposalDetail }) {
  const sections = extractSections(proposal.content)
  const placeholders = countPlaceholders(proposal.content)

  return (
    <aside className="space-y-4 @4xl:sticky @4xl:top-20">
      {placeholders > 0 && (
        <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            <span className="font-medium">
              {placeholders === 1 ? '1 ponto a definir' : `${placeholders} pontos a definir`}
            </span>
            <span className="block text-muted-foreground">
              A IA marcou o que faltou no briefing. Revise antes de enviar.
            </span>
          </p>
        </div>
      )}

      {sections.length > 0 && (
        <nav aria-label="Sumário" className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ListTree className="size-4 text-muted-foreground" />
            Sumário
          </h2>
          <ol className="space-y-0.5">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span className="font-mono text-xs leading-5 tabular-nums opacity-60">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{section.text}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Detalhes</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Cliente</dt>
          <dd className="truncate text-right">{proposal.client_name}</dd>
          <dt className="text-muted-foreground">Versão</dt>
          <dd className="text-right tabular-nums">{proposal.version || '—'}</dd>
          <dt className="text-muted-foreground">Seu papel</dt>
          <dd className="text-right">{ROLE[proposal.role]}</dd>
          <dt className="text-muted-foreground">Criada</dt>
          <dd className="text-right" title={formatDateTime(proposal.created_at)}>
            {formatDate(proposal.created_at, 'short')}
          </dd>
          <dt className="text-muted-foreground">Atualizada</dt>
          <dd className="text-right" title={formatDateTime(proposal.updated_at)}>
            {formatDate(proposal.updated_at, 'short')}
          </dd>
        </dl>
      </div>

      {proposal.briefing && (
        <Collapsible className="rounded-xl border bg-card">
          <CollapsibleTrigger className="group flex w-full items-center justify-between p-4 text-sm font-medium">
            Briefing
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-panel-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="max-h-80 overflow-y-auto border-t px-4 py-3 text-sm whitespace-pre-wrap text-muted-foreground">
              {proposal.briefing}
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </aside>
  )
}
