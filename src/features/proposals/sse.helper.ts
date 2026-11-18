export type SseMessage = { event: string; data: string }

const LINE_BREAK = /\r\n|\r|\n/

export async function* readSse(stream: ReadableStream<Uint8Array>): AsyncGenerator<SseMessage> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let event = ''
  let data: string[] = []
  try {
    while (true) {
      const { value, done } = await reader.read()
      // An event without its closing blank line is incomplete, and the SSE spec says to drop it.
      if (done) return
      buffer += decoder.decode(value, { stream: true })
      // A chunk may end between "\r" and "\n"; keep the "\r" until the next chunk decides.
      const cut = buffer.endsWith('\r') ? buffer.length - 1 : buffer.length
      const lines = buffer.slice(0, cut).split(LINE_BREAK)
      buffer = lines.pop() + buffer.slice(cut)
      for (const line of lines) {
        if (line === '') {
          if (data.length) yield { event: event || 'message', data: data.join('\n') }
          event = ''
          data = []
          continue
        }
        if (line.startsWith(':')) continue
        const colon = line.indexOf(':')
        const field = colon === -1 ? line : line.slice(0, colon)
        const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
        if (field === 'event') event = value
        else if (field === 'data') data.push(value)
      }
    }
  } finally {
    reader.releaseLock()
  }
}
