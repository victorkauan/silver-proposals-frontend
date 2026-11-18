import { PLACEHOLDER } from '@features/proposals/markdown.helper'

export type TextEdit = { value: string; selectionStart: number; selectionEnd: number }

export function wrapSelection(
  value: string,
  start: number,
  end: number,
  marker: string,
  fallback: string,
): TextEdit {
  const selected = value.slice(start, end) || fallback
  const next = value.slice(0, start) + marker + selected + marker + value.slice(end)
  const selectionStart = start + marker.length
  return { value: next, selectionStart, selectionEnd: selectionStart + selected.length }
}

export function prefixLines(
  value: string,
  start: number,
  end: number,
  prefix: (index: number) => string,
): TextEdit {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const newline = value.indexOf('\n', end)
  const lineEnd = newline === -1 ? value.length : newline
  const lines = value.slice(lineStart, lineEnd).split('\n')
  const block = lines.map((line, index) => prefix(index) + line).join('\n')
  return {
    value: value.slice(0, lineStart) + block + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + block.length,
  }
}

export function nextPlaceholder(value: string, from: number): number {
  const after = value.indexOf(PLACEHOLDER, from)
  return after === -1 ? value.indexOf(PLACEHOLDER) : after
}

export function countWords(value: string): number {
  return value.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
}
