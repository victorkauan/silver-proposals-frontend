import { chunkStream } from '@shared/test/sse.helper'
import { readSse, type SseMessage } from '@features/proposals/sse.helper'

async function collect(chunks: string[]): Promise<SseMessage[]> {
  const messages: SseMessage[] = []
  for await (const message of readSse(chunkStream(chunks))) messages.push(message)
  return messages
}

describe('readSse', () => {
  it('reads named events', async () => {
    await expect(
      collect(['event: delta\ndata: {"text":"a"}\n\nevent: done\ndata: {}\n\n']),
    ).resolves.toEqual([
      { event: 'delta', data: '{"text":"a"}' },
      { event: 'done', data: '{}' },
    ])
  })

  it('joins events split across chunks, including a CRLF split in the middle', async () => {
    await expect(collect(['event: del', 'ta\r', '\ndata: x\r\n\r', '\n'])).resolves.toEqual([
      { event: 'delta', data: 'x' },
    ])
  })

  it('ignores comments, unknown fields, and blocks without data', async () => {
    await expect(collect([': ping\n\nid: 1\nretry: 10\n\nevent: x\n\ndata\n\n'])).resolves.toEqual([
      { event: 'message', data: '' },
    ])
  })

  it('joins multi-line data and drops an event that never ends', async () => {
    await expect(collect(['data: one\ndata:two\r', '\rdata: three'])).resolves.toEqual([
      { event: 'message', data: 'one\ntwo' },
    ])
  })
})
