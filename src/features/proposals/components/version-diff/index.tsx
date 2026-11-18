import { cn } from '@shared/helpers/cn.helper'
import { diffContent } from '@features/proposals/diff.helper'

const ROW = {
  added: 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200',
  removed: 'bg-rose-500/10 text-rose-900 line-through decoration-rose-500/40 dark:text-rose-200',
  same: 'text-muted-foreground',
}

const SIGN = { added: '+', removed: '−', same: ' ' }

export function VersionDiff({ before, after }: { before: string; after: string }) {
  const { blocks, added, removed } = diffContent(before, after)

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2 text-xs">
        <span className="font-medium text-emerald-700 dark:text-emerald-400">
          +{added} {added === 1 ? 'linha' : 'linhas'}
        </span>
        <span className="font-medium text-rose-700 dark:text-rose-400">
          −{removed} {removed === 1 ? 'linha' : 'linhas'}
        </span>
      </div>
      {added === 0 && removed === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma diferença de conteúdo.
        </p>
      ) : (
        <div
          role="table"
          aria-label="Alterações"
          className="overflow-x-auto font-mono text-[13px] leading-6"
        >
          {blocks.map((block, index) =>
            block.type === 'skipped' ? (
              <div
                key={index}
                className="border-y border-dashed bg-muted/30 px-4 py-1 text-xs text-muted-foreground first:border-t-0 last:border-b-0"
              >
                {block.count === 1
                  ? '1 linha sem alteração'
                  : `${block.count} linhas sem alteração`}
              </div>
            ) : (
              block.lines.map((line, lineIndex) => (
                <div
                  key={`${index}-${lineIndex}`}
                  role="row"
                  data-kind={line.kind}
                  className={cn('flex min-w-fit whitespace-pre-wrap', ROW[line.kind])}
                >
                  <span aria-hidden className="w-8 shrink-0 text-center opacity-60 select-none">
                    {SIGN[line.kind]}
                  </span>
                  <span className="pr-4">{line.text || ' '}</span>
                </div>
              ))
            ),
          )}
        </div>
      )}
    </div>
  )
}
