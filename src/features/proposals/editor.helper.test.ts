import {
  countWords,
  nextPlaceholder,
  prefixLines,
  wrapSelection,
} from '@features/proposals/editor.helper'

describe('editor helpers', () => {
  it('wraps the selection, or a fallback word, and selects the wrapped text', () => {
    expect(wrapSelection('um texto', 3, 8, '**', 'negrito')).toEqual({
      value: 'um **texto**',
      selectionStart: 5,
      selectionEnd: 10,
    })
    expect(wrapSelection('ab', 1, 1, '_', 'itálico')).toEqual({
      value: 'a_itálico_b',
      selectionStart: 2,
      selectionEnd: 9,
    })
  })

  it('prefixes every line touched by the selection', () => {
    const value = 'título\num\ndois\nfim'
    expect(prefixLines(value, 8, 12, (index) => `${index + 1}. `)).toEqual({
      value: 'título\n1. um\n2. dois\nfim',
      selectionStart: 7,
      selectionEnd: 20,
    })
    expect(prefixLines('linha', 0, 0, () => '## ').value).toBe('## linha')
  })

  it('finds the next placeholder and wraps around to the first one', () => {
    const value = 'a [A DEFINIR] b [A DEFINIR]'
    expect(nextPlaceholder(value, 0)).toBe(2)
    expect(nextPlaceholder(value, 3)).toBe(16)
    expect(nextPlaceholder(value, 20)).toBe(2)
    expect(nextPlaceholder('nada', 0)).toBe(-1)
  })

  it('counts words, ignoring Markdown symbols', () => {
    expect(countWords('# Proposta comercial\n\n- item um — fim')).toBe(5)
    expect(countWords('   ')).toBe(0)
  })
})
