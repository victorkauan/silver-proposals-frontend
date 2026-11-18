import { screen } from '@testing-library/react'

import { renderRoute } from '@shared/test/render.helper'
import { LoginPage } from '@features/auth/pages/login'

describe('AuthLayout', () => {
  it('shows the brand and the product panel next to the form', () => {
    renderRoute(<LoginPage />, { path: '/entrar' })

    expect(screen.getAllByText('Silver Proposals').length).toBeGreaterThan(0)
    expect(screen.getByText('Do briefing à proposta pronta em segundos.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('voce@empresa.com.br')).toBeInTheDocument()
  })
})
