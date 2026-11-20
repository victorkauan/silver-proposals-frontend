import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

const PASSWORD = 'senha de teste longa'

test('manages the account: profile, privacy notice, data export, and deletion', async ({
  page,
}) => {
  test.setTimeout(90_000)
  const email = `e2e-conta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

  await test.step('signs up after accepting the privacy notice', async () => {
    await page.goto('/cadastro')
    await page.getByLabel('Nome').fill('Bia Teste')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(PASSWORD)
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('Aceite o aviso de privacidade para continuar.')).toBeVisible()

    await page.getByRole('checkbox', { name: /aviso de privacidade/ }).check()
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('heading', { name: 'Olá, Bia' })).toBeVisible()
  })

  await test.step('renames the profile', async () => {
    await page.getByText(email).first().click()
    await page.getByRole('menuitem', { name: 'Minha conta' }).click()
    await expect(page).toHaveURL(/\/conta\/perfil$/)
    await page.getByLabel('Nome').fill('Beatriz Teste')
    await page.getByRole('button', { name: 'Salvar nome' }).click()
    await expect(page.getByText('Nome atualizado.')).toBeVisible()
  })

  await test.step('reads the privacy notice and exports the data', async () => {
    await page.getByRole('link', { name: 'Privacidade e dados' }).click()
    await expect(page.getByText(/Versão atual aceita em/)).toBeVisible()

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exportar meus dados' }).click()
    const file = await download
    expect(file.suggestedFilename()).toBe('silver-proposals-dados.json')
    const data = JSON.parse(await readFile(await file.path(), 'utf8'))
    expect(data.account).toMatchObject({ email, name: 'Beatriz Teste' })
    expect(JSON.stringify(data)).not.toContain('password_hash')

    await page.getByRole('link', { name: /Ler o aviso/ }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Aviso de privacidade' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(/\/conta\/dados$/)
  })

  await test.step('deletes the account and can no longer log in', async () => {
    await page.getByRole('button', { name: 'Excluir conta' }).click()
    await page.getByLabel('Senha atual').fill(PASSWORD)
    await page.getByLabel(/Para confirmar/).fill('EXCLUIR')
    await page.getByRole('button', { name: 'Excluir definitivamente' }).click()

    await expect(page).toHaveURL(/\/entrar$/)
    await expect(page.getByRole('status')).toHaveText(/Sua conta foi excluída/)

    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('E-mail ou senha inválidos.')).toBeVisible()
  })
})
