import { diffLines } from 'diff'

export type DiffLine = { kind: 'added' | 'removed' | 'same'; text: string }
export type DiffBlock = { type: 'lines'; lines: DiffLine[] } | { type: 'skipped'; count: number }

export type DiffResult = { blocks: DiffBlock[]; added: number; removed: number }

const CONTEXT = 2

function toLines(text: string): string[] {
  const lines = text.split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines
}

export function diffContent(before: string, after: string): DiffResult {
  const lines: DiffLine[] = diffLines(before, after).flatMap((change) =>
    toLines(change.value).map((text) => ({
      kind: change.added ? 'added' : change.removed ? 'removed' : 'same',
      text,
    })),
  )
  const added = lines.filter((line) => line.kind === 'added').length
  const removed = lines.filter((line) => line.kind === 'removed').length

  const keep = lines.map((line) => line.kind !== 'same')
  lines.forEach((line, index) => {
    if (line.kind === 'same') return
    for (let offset = -CONTEXT; offset <= CONTEXT; offset++) {
      if (lines[index + offset]) keep[index + offset] = true
    }
  })

  const blocks: DiffBlock[] = []
  lines.forEach((line, index) => {
    const last = blocks.at(-1)
    if (keep[index]) {
      if (last?.type === 'lines') last.lines.push(line)
      else blocks.push({ type: 'lines', lines: [line] })
    } else if (last?.type === 'skipped') last.count++
    else blocks.push({ type: 'skipped', count: 1 })
  })
  return { blocks, added, removed }
}
