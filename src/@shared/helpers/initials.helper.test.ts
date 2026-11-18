import { initials } from '@shared/helpers/initials.helper'

describe('initials', () => {
  it.each([
    ['Ana Lima', 'AL'],
    ['ana maria de souza', 'AS'],
    ['Victor', 'V'],
    ['  ', '?'],
  ])('%s → %s', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
