import { formatDate, formatDateTime, formatRelative } from '@shared/helpers/date.helper'

describe('date helpers', () => {
  const now = new Date('2026-11-18T12:00:00Z')

  it('formats relative times in pt-BR', () => {
    expect(formatRelative('2026-11-18T11:59:40Z', now)).toBe('agora mesmo')
    expect(formatRelative('2026-11-18T11:55:00Z', now)).toBe('há 5 minutos')
    expect(formatRelative('2026-11-18T09:00:00Z', now)).toBe('há 3 horas')
    expect(formatRelative('2026-11-17T12:00:00Z', now)).toBe('ontem')
    expect(formatRelative('2025-11-18T12:00:00Z', now)).toBe('ano passado')
  })

  it('formats absolute dates in pt-BR', () => {
    expect(formatDate('2026-11-18T12:00:00Z')).toBe('18 de novembro de 2026')
    expect(formatDate('2026-11-18T12:00:00Z', 'short')).toBe('18 de nov. de 2026')
    expect(formatDateTime('2026-11-18T12:00:00Z')).toMatch(/18 de nov\. de 2026/)
  })
})
