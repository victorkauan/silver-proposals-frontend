import { render, screen } from '@testing-library/react'

import { App } from '@features/app'

describe('App', () => {
  it('renders the product name', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Silver Proposals' })).toBeInTheDocument()
  })
})
