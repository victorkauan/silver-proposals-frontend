import { createHmac } from 'node:crypto'

import { expect, type Page, test } from '@playwright/test'

const PASSWORD = 'senha de teste longa'
const NEW_PASSWORD = 'nova senha de teste longa'

function totp(secret: string, step: number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bits = [...secret]
    .map((character) => alphabet.indexOf(character).toString(2).padStart(5, '0'))
    .join('')
  const key = Buffer.from(bits.match(/.{8}/g)!.map((byte) => Number.parseInt(byte, 2)))
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const digest = createHmac('sha1', key).update(counter).digest()
  const offset = digest[digest.length - 1]! & 0x0f
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return String(code).padStart(6, '0')
}

function currentStep() {
  return Math.floor(Date.now() / 30_000)
}

async function enterPassword(page: Page, email: string, password = PASSWORD) {
  await page.goto('/conta/seguranca')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

test('manages two-factor authentication, recovery codes, passwords, and sessions', async ({
  page,
  browser,
}) => {
  test.setTimeout(90_000)
  const email = `e2e-seguranca-${crypto.randomUUID()}@example.com`
  const other = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0) Firefox/123.0' })
  const recovery = await browser.newPage({ userAgent: 'Mozilla/5.0 (iPhone) Safari/605.1' })
  const dialog = page.getByRole('dialog')
  const sessions = page.getByRole('list', { name: 'Sessões ativas' })
  let secret = ''
  let recoveryCode = ''

  try {
    await test.step('enrolls an authenticator and receives ten recovery codes', async () => {
      await page.goto('/cadastro')
      await page.getByLabel('Nome').fill('Ana Segurança')
      await page.getByLabel('E-mail').fill(email)
      await page.getByLabel('Senha').fill(PASSWORD)
      await page.getByRole('checkbox', { name: /aviso de privacidade/ }).check()
      await page.getByRole('button', { name: 'Criar conta' }).click()
      await expect(page).toHaveURL('/')
      await page.goto('/conta/seguranca')
      await page.getByRole('button', { name: 'Ativar verificação' }).click()
      await dialog.getByLabel('Senha atual').fill(PASSWORD)
      await dialog.getByRole('button', { name: 'Continuar' }).click()
      await expect(dialog.getByText('QR code do app autenticador')).toBeAttached()
      secret = (await dialog.getByLabel('Chave manual', { exact: true }).innerText()).trim()
      await dialog.getByLabel('Código de 6 dígitos').fill(totp(secret, currentStep() - 1))
      await dialog.getByRole('button', { name: 'Confirmar e ativar' }).click()
      const codes = dialog
        .getByRole('list', { name: 'Códigos de recuperação' })
        .getByRole('listitem')
      await expect(codes).toHaveCount(10)
      recoveryCode = await codes.first().innerText()
      await dialog.getByRole('button', { name: 'Concluir' }).click()
      await expect(page.getByText('10 de 10 códigos de recuperação disponíveis.')).toBeVisible()
    })

    await test.step('signs in with the authenticator and with a recovery code', async () => {
      await enterPassword(other, email)
      await other.getByLabel('Código do app autenticador').fill(totp(secret, currentStep()))
      await other.getByRole('button', { name: 'Verificar' }).click()
      await expect(other).toHaveURL('/conta/seguranca')

      await enterPassword(recovery, email)
      await recovery.getByRole('button', { name: 'Usar um código de recuperação' }).click()
      await recovery.getByLabel('Código de recuperação').fill(recoveryCode)
      await recovery.getByRole('button', { name: 'Verificar' }).click()
      await expect(recovery).toHaveURL('/conta/seguranca')
    })

    await test.step('revokes one remote session and then all remaining remote sessions', async () => {
      await page.reload()
      await expect(sessions.getByRole('listitem')).toHaveCount(3)
      await expect(page.getByText('9 de 10 códigos de recuperação disponíveis.')).toBeVisible()
      const firefox = sessions.getByRole('listitem').filter({ hasText: 'Firefox' })
      await firefox.getByRole('button', { name: 'Encerrar sessão' }).click()
      await dialog.getByRole('button', { name: 'Confirmar encerramento' }).click()
      await expect(sessions.getByRole('listitem')).toHaveCount(2)
      await other.reload()
      await expect(other).toHaveURL('/entrar')

      await page.getByRole('button', { name: 'Encerrar outras sessões' }).click()
      await dialog.getByRole('button', { name: 'Encerrar todas as outras' }).click()
      await expect(sessions.getByRole('listitem')).toHaveCount(1)
      await expect(sessions.getByText('Sessão atual')).toBeVisible()
      await recovery.reload()
      await expect(recovery).toHaveURL('/entrar')
    })

    await test.step('regenerates codes, disables 2FA, and changes the password', async () => {
      await page.getByRole('button', { name: 'Gerar novos códigos' }).click()
      await dialog.getByLabel('Senha atual').fill(PASSWORD)
      await dialog.getByRole('button', { name: 'Gerar novos códigos' }).click()
      const codes = dialog
        .getByRole('list', { name: 'Códigos de recuperação' })
        .getByRole('listitem')
      await expect(codes).toHaveCount(10)
      const newCode = await codes.first().innerText()
      await dialog.getByRole('button', { name: 'Concluir' }).click()
      await page.getByRole('button', { name: 'Desativar', exact: true }).click()
      await dialog.getByLabel('Senha atual').fill(PASSWORD)
      await dialog.getByLabel('Código de 6 dígitos').fill('12345')
      await expect(dialog.getByRole('button', { name: 'Confirmar desativação' })).toBeDisabled()
      await dialog.getByRole('button', { name: 'Usar um código de recuperação' }).click()
      await dialog.getByLabel('Código de recuperação').fill(newCode)
      await dialog.getByRole('button', { name: 'Confirmar desativação' }).click()
      await expect(page.getByText('Desativada', { exact: true })).toBeVisible()

      await page.getByRole('button', { name: 'Trocar senha' }).click()
      await dialog.getByLabel('Senha atual').fill(PASSWORD)
      await dialog.getByLabel('Nova senha').fill(NEW_PASSWORD)
      await dialog.getByRole('button', { name: 'Salvar nova senha' }).click()
      await expect(page.getByText('Senha atualizada.')).toBeVisible()
      await page.getByRole('button', { name: 'Sair deste navegador' }).click()
      await dialog.getByRole('button', { name: 'Confirmar encerramento' }).click()
      await expect(page).toHaveURL('/entrar')
      await enterPassword(page, email, NEW_PASSWORD)
      await expect(page).toHaveURL('/conta/seguranca')
    })
  } finally {
    await other.close()
    await recovery.close()
  }
})
