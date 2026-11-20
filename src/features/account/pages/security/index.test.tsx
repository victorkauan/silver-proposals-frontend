import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { stubApi } from '@shared/test/fetch.helper'
import { fakeSession, fakeUser, renderRoute } from '@shared/test/render.helper'
import { jsonResponse } from '@shared/test/sse.helper'
import { SecurityPage } from '@features/account/pages/security'

function visit() {
  const session = fakeSession({ status: 'authenticated', user: fakeUser() })
  renderRoute(<SecurityPage />, { session, path: '/conta/seguranca' })
  return { session, user: userEvent.setup() }
}

const status = (enabled: boolean) => ({
  enabled,
  enabled_at: null,
  recovery_codes_remaining: enabled ? 10 : 0,
})

const device = {
  id: 'current',
  started_at: '2026-11-20T18:00:00Z',
  last_active_at: '2026-11-20T18:01:00Z',
  expires_at: '2026-11-27T18:01:00Z',
  user_agent: 'Chrome/123 Linux',
  current: true,
}

const codes = ['abcde-23456', 'fghjk-78923']

describe('SecurityPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('enrolls with a manual key, copies recovery codes, and lets the user replace or disable them', async () => {
    let enabled = false
    stubApi({
      'GET /account/two-factor': () => jsonResponse(200, status(enabled)),
      'GET /account/sessions': () => jsonResponse(200, [device]),
      'POST /account/two-factor/setup': () =>
        jsonResponse(200, { secret: 'TESTKEY', otpauth_uri: 'otpauth://totp/Test?secret=TESTKEY' }),
      'POST /account/two-factor/enable': () => {
        enabled = true
        return jsonResponse(200, { codes })
      },
      'POST /account/two-factor/recovery-codes': () =>
        jsonResponse(200, { codes: ['mnpqr-45678'] }),
      'POST /account/two-factor/disable': () => {
        enabled = false
        return new Response(null, { status: 204 })
      },
    })
    const { session, user } = visit()
    await user.click(await screen.findByRole('button', { name: 'Ativar verificação' }))
    const dialog = () => within(screen.getByRole('dialog'))
    const enterPassword = () => user.type(dialog().getByLabelText('Senha atual'), 'uma senha longa')
    await enterPassword()
    await user.click(dialog().getByRole('button', { name: 'Continuar' }))
    expect(await dialog().findByText('TESTKEY')).toBeVisible()
    await user.click(dialog().getByRole('button', { name: 'Copiar chave manual' }))
    expect(await navigator.clipboard.readText()).toBe('TESTKEY')
    await user.type(dialog().getByLabelText('Código de 6 dígitos'), '123456')
    await user.click(dialog().getByRole('button', { name: 'Confirmar e ativar' }))
    expect(await dialog().findByText(codes[0]!)).toBeVisible()
    await user.click(dialog().getByRole('button', { name: 'Copiar códigos' }))
    expect(await navigator.clipboard.readText()).toBe(codes.join('\n'))
    await user.click(dialog().getByRole('button', { name: 'Concluir' }))
    expect(session.setUser).toHaveBeenCalledWith(
      expect.objectContaining({ two_factor_enabled: true }),
    )

    await user.click(await screen.findByRole('button', { name: 'Gerar novos códigos' }))
    await enterPassword()
    await user.click(dialog().getByRole('button', { name: 'Gerar novos códigos' }))
    expect(await dialog().findByText('mnpqr-45678')).toBeVisible()
    await user.click(dialog().getByRole('button', { name: 'Concluir' }))

    await user.click(await screen.findByRole('button', { name: 'Desativar' }))
    await enterPassword()
    const authenticator = dialog().getByLabelText('Código de 6 dígitos')
    await user.type(authenticator, '123x45')
    expect(authenticator).toHaveValue('12345')
    const confirm = dialog().getByRole('button', { name: 'Confirmar desativação' })
    expect(confirm).toBeDisabled()
    await user.type(authenticator, '6')
    expect(confirm).toBeEnabled()
    await user.click(dialog().getByRole('button', { name: 'Usar um código de recuperação' }))
    expect(dialog().getByLabelText('Senha atual')).toHaveValue('uma senha longa')
    expect(confirm).toBeDisabled()
    await user.type(dialog().getByLabelText('Código de recuperação'), 'mnpqr-45678')
    await user.click(dialog().getByRole('button', { name: 'Confirmar desativação' }))
    expect(await screen.findByText('Desativada')).toBeVisible()
    expect(session.setUser).toHaveBeenLastCalledWith(
      expect.objectContaining({ two_factor_enabled: false }),
    )
  }, 15_000)

  it('revokes remote sessions and ends the local session when it is revoked', async () => {
    let sessions = [
      device,
      { ...device, id: 'remote', user_agent: 'Firefox/123 Windows', current: false },
      { ...device, id: 'other', user_agent: 'Safari/123 iPhone', current: false },
    ]
    stubApi({
      'GET /account/two-factor': () => jsonResponse(200, status(false)),
      'GET /account/sessions': () => jsonResponse(200, sessions),
      'DELETE /account/sessions/remote': () => {
        sessions = sessions.filter(({ id }) => id !== 'remote')
        return new Response(null, { status: 204 })
      },
      'POST /account/sessions/revoke-others': () => {
        sessions = [device]
        return jsonResponse(200, { revoked: 1 })
      },
      'DELETE /account/sessions/current': () => new Response(null, { status: 204 }),
    })
    const { session, user } = visit()
    const list = await screen.findByRole('list', { name: 'Sessões ativas' })
    expect(within(list).getByText('Sessão atual')).toBeVisible()
    const remote = within(list)
      .getAllByRole('listitem')
      .find((item) => item.textContent?.includes('Firefox'))!
    await user.click(within(remote).getByRole('button', { name: 'Encerrar sessão' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar encerramento' }))
    await waitFor(() =>
      expect(within(list).queryByText('Firefox · Windows')).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: 'Encerrar outras sessões' }))
    await user.click(screen.getByRole('button', { name: 'Encerrar todas as outras' }))
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: 'Sair deste navegador' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar encerramento' }))
    await waitFor(() => expect(session.endSession).toHaveBeenCalledOnce())
  })

  it('retries unavailable settings and reports a failed password verification', async () => {
    let failures = 0
    stubApi({
      'GET /account/two-factor': () =>
        failures++ === 0
          ? jsonResponse(503, { code: 'unavailable', message: 'Verificação indisponível.' })
          : jsonResponse(200, status(false)),
      'GET /account/sessions': () => jsonResponse(200, []),
      'PUT /account/password': () =>
        jsonResponse(403, { code: 'invalid_password', message: 'Senha incorreta.' }),
    })
    const { user } = visit()
    expect(await screen.findByText('Verificação indisponível.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Desativada')).toBeVisible()
    expect(await screen.findByText('Nenhuma sessão ativa.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Trocar senha' }))
    await user.type(screen.getByLabelText('Senha atual'), 'senha errada')
    await user.type(screen.getByLabelText('Nova senha'), 'nova senha longa')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
    expect(await screen.findByText('Senha incorreta.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
