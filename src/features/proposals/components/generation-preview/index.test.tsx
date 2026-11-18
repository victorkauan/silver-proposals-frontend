import { render } from '@testing-library/react'

import { GenerationPreview } from '@features/proposals/components/generation-preview'

describe('GenerationPreview', () => {
  afterEach(() => vi.restoreAllMocks())

  it('scrolls into view without returning the scroll result as an effect cleanup', () => {
    // Recent Chromium returns a Promise from scrollIntoView; returning it from an effect crashes production React.
    const scroll = vi.fn(() => Promise.resolve())
    Element.prototype.scrollIntoView = scroll as unknown as Element['scrollIntoView']
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { unmount } = render(<GenerationPreview text="# Proposta" meta={[]} />)
    unmount()

    expect(scroll).toHaveBeenCalledOnce()
    expect(error).not.toHaveBeenCalled()
  })
})
