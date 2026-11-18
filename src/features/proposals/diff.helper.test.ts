import { diffContent } from '@features/proposals/diff.helper'

describe('diffContent', () => {
  it('counts added and removed lines and keeps two lines of context', () => {
    const before = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].join('\n')
    const after = ['a', 'b', 'c', 'd', 'e', 'f', 'NOVO', 'h'].join('\n')

    const result = diffContent(before, after)

    expect(result).toMatchObject({ added: 1, removed: 1 })
    expect(result.blocks).toEqual([
      { type: 'skipped', count: 4 },
      {
        type: 'lines',
        lines: [
          { kind: 'same', text: 'e' },
          { kind: 'same', text: 'f' },
          { kind: 'removed', text: 'g' },
          { kind: 'added', text: 'NOVO' },
          { kind: 'same', text: 'h' },
        ],
      },
    ])
  })

  it('treats a first version as all additions', () => {
    expect(diffContent('', '# Proposta\n\nTexto\n')).toMatchObject({ added: 3, removed: 0 })
  })

  it('reports no changes for identical content', () => {
    expect(diffContent('igual\n', 'igual\n')).toEqual({
      blocks: [{ type: 'skipped', count: 1 }],
      added: 0,
      removed: 0,
    })
  })
})
