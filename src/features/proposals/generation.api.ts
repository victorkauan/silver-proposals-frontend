import { request } from '@shared/api/http.client'
import { readSse } from '@features/proposals/sse.helper'

export type GenerationEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; version: number }
  | { type: 'error'; code: string; message: string }

export const GENERATION_FAILED_MESSAGE = 'Não foi possível gerar a proposta. Tente novamente.'

const STREAM_ENDED: GenerationEvent = {
  type: 'error',
  code: 'stream_interrupted',
  message: GENERATION_FAILED_MESSAGE,
}

function parse(event: string, data: string): GenerationEvent | null {
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(data) as Record<string, unknown>
  } catch {
    return null
  }
  if (event === 'delta' && typeof payload.text === 'string') {
    return { type: 'delta', text: payload.text }
  }
  if (event === 'done' && typeof payload.version === 'number') {
    return { type: 'done', version: payload.version }
  }
  if (event === 'error') {
    return {
      type: 'error',
      code: typeof payload.code === 'string' ? payload.code : 'generation_failed',
      message: typeof payload.message === 'string' ? payload.message : GENERATION_FAILED_MESSAGE,
    }
  }
  return null
}

export async function* streamGeneration(
  proposalId: string,
  signal: AbortSignal,
): AsyncGenerator<GenerationEvent> {
  const response = await request(`/proposals/${encodeURIComponent(proposalId)}/generate`, {
    method: 'POST',
    signal,
  })
  if (!response.body) {
    yield STREAM_ENDED
    return
  }
  for await (const message of readSse(response.body)) {
    const event = parse(message.event, message.data)
    if (!event) continue
    yield event
    if (event.type !== 'delta') return
  }
  yield STREAM_ENDED
}
