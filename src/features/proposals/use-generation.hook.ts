import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { errorMessage } from '@shared/api/error-message.helper'
import { GENERATION_FAILED_MESSAGE, streamGeneration } from '@features/proposals/generation.api'
import { proposalKeys } from '@features/proposals/proposal.api'

export const GENERATION_TIMEOUT_MS = 180_000
export const GENERATION_TIMEOUT_MESSAGE = 'A geração demorou demais. Tente novamente.'

export type GenerationState =
  | { status: 'idle'; text: ''; error: null }
  | { status: 'streaming'; text: string; error: null }
  | { status: 'done'; text: string; error: null }
  | { status: 'error'; text: string; error: string }

const IDLE: GenerationState = { status: 'idle', text: '', error: null }

function isAbort(error: unknown): boolean {
  return (
    error instanceof DOMException && (error.name === 'AbortError' || error.name === 'TimeoutError')
  )
}

export function useGeneration() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<GenerationState>(IDLE)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const generate = useCallback(
    async (proposalId: string): Promise<boolean> => {
      controller.current?.abort()
      const current = new AbortController()
      controller.current = current
      const timeout = AbortSignal.timeout(GENERATION_TIMEOUT_MS)
      const signal = AbortSignal.any([current.signal, timeout])
      let text = ''
      let ok = false
      setState({ status: 'streaming', text, error: null })
      try {
        for await (const event of streamGeneration(proposalId, signal)) {
          if (event.type === 'delta') {
            text += event.text
            setState({ status: 'streaming', text, error: null })
          } else if (event.type === 'done') {
            ok = true
          } else {
            setState({ status: 'error', text, error: event.message })
          }
        }
      } catch (error) {
        if (current.signal.aborted) return false
        const message = timeout.aborted
          ? GENERATION_TIMEOUT_MESSAGE
          : isAbort(error)
            ? GENERATION_FAILED_MESSAGE
            : errorMessage(error)
        setState({ status: 'error', text, error: message })
      } finally {
        if (controller.current === current) controller.current = null
      }
      if (!ok) return false
      // Keep showing the stream until the saved version is cached, so the old content never flashes back.
      await queryClient.invalidateQueries({ queryKey: proposalKeys.all })
      if (!current.signal.aborted) setState({ status: 'done', text, error: null })
      return true
    },
    [queryClient],
  )

  const reset = useCallback(() => {
    controller.current?.abort()
    setState(IDLE)
  }, [])

  return { ...state, generate, reset }
}
