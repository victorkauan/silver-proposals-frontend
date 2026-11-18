import { countPlaceholders, extractSections } from '@features/proposals/markdown.helper'

describe('markdown helpers', () => {
  it('lists the level-2 sections, ignoring code blocks and inline markup', () => {
    const markdown = [
      '# Proposta',
      '## Resumo',
      '```',
      '## not a heading',
      '```',
      '## **Escopo** do [projeto](https://x.dev) ##',
      '### Detalhe',
    ].join('\n')

    expect(extractSections(markdown)).toEqual([
      { id: 'secao-1', text: 'Resumo' },
      { id: 'secao-2', text: 'Escopo do projeto' },
    ])
  })

  it('counts the placeholders the AI left', () => {
    expect(countPlaceholders('Prazo: [A DEFINIR]. Valor: [A DEFINIR].')).toBe(2)
    expect(countPlaceholders('Tudo definido.')).toBe(0)
  })
})
