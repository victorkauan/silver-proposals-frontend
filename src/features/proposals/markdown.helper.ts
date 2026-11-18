export const PLACEHOLDER = '[A DEFINIR]'

export type Heading = { id: string; text: string }

export function sectionId(index: number): string {
  return `secao-${index + 1}`
}

function clean(text: string): string {
  return text
    .replace(/[*_`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim()
}

export function extractSections(markdown: string): Heading[] {
  const headings: Heading[] = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    const match = !fenced && /^##\s+(.+?)\s*#*\s*$/.exec(line)
    if (match) headings.push({ id: sectionId(headings.length), text: clean(match[1]) })
  }
  return headings
}

export function countPlaceholders(markdown: string): number {
  return markdown.split(PLACEHOLDER).length - 1
}
