import { expect, test } from '@playwright/test'

const PASSWORD = 'senha de teste longa'

test('signs up, generates, edits, and shares a proposal', async ({ page, browser }) => {
  test.setTimeout(120_000)
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  const title = `Site institucional ${Date.now()}`

  await test.step('sign up', async () => {
    await page.goto('/cadastro')
    await page.getByLabel('Nome').fill('Ana Teste')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(PASSWORD)
    await page.getByRole('checkbox', { name: /aviso de privacidade/ }).check()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible()
    await expect(page.getByText('Nenhuma proposta ainda')).toBeVisible()
  })

  await test.step('log out and log in again', async () => {
    await page.getByText(email).first().click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/entrar$/)

    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible()
  })

  await test.step('generate a proposal from a briefing', async () => {
    await page.getByRole('link', { name: 'Criar primeira proposta' }).click()
    await page.getByLabel('Título').fill(title)
    await page.getByLabel('Cliente').fill('Padaria Pão Quente')
    await page.getByLabel('Briefing').fill('Site com cardápio online e encomendas pelo WhatsApp.')
    await page.getByRole('button', { name: 'Gerar proposta' }).click()

    await expect(page).toHaveURL(/\/propostas\/[0-9a-f-]{36}$/, { timeout: 45_000 })
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Resumo' })).toBeVisible()
    await expect(page.getByText('Versão 1', { exact: true })).toBeVisible()
  })

  await test.step('edit and save the content', async () => {
    await page.getByRole('link', { name: 'Editar' }).click()
    const editor = page.getByLabel('Conteúdo em Markdown')
    await expect(editor).toHaveValue(/## Resumo/)
    await editor.press('ControlOrMeta+End')
    await editor.pressSequentially('\n\n## Observações do e2e\nTexto revisado.')
    await expect(page.getByText('Alterações não salvas')).toBeVisible()
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Proposta salva')).toBeVisible()
    await expect(page.getByText(/Versão 2 salva/)).toBeVisible()
  })

  await test.step('see both versions in the history', async () => {
    await page.getByRole('link', { name: title }).click()
    await expect(page.getByRole('heading', { name: 'Observações do e2e' })).toBeVisible()
    await page.getByRole('link', { name: 'Histórico' }).click()
    const versions = page.getByRole('navigation', { name: 'Versões' })
    await expect(versions.getByRole('button', { name: /Versão 2.*Editada/ })).toBeVisible()
    await expect(versions.getByRole('button', { name: /Versão 1.*Gerada pela IA/ })).toBeVisible()
    await page.getByRole('link', { name: title }).click()
  })

  let shareUrl = ''
  await test.step('create a share link', async () => {
    await page.getByRole('button', { name: 'Compartilhar' }).click()
    const dialog = page.getByRole('dialog', { name: 'Compartilhar proposta' })
    await dialog.getByRole('button', { name: 'Criar link' }).click()
    const field = dialog.getByLabel('Link de compartilhamento')
    await expect(field).toHaveValue(/\/p\/[\w-]{20,}$/)
    shareUrl = await field.inputValue()
  })

  await test.step('check the home dashboard and the separate proposal list', async () => {
    await page.keyboard.press('Escape')
    await page.getByRole('link', { name: 'Início', exact: true }).click()
    await expect(page).toHaveURL('/')
    const recent = page.getByRole('region', { name: 'Propostas recentes' })
    await expect(recent.getByRole('link', { name: new RegExp(title) })).toContainText(
      'Compartilhada',
    )
    const sharing = page.getByRole('region', { name: 'Links de compartilhamento' })
    await expect(sharing.getByRole('link', { name: new RegExp(title) })).toContainText('Expira em')
    await expect(page.getByRole('region', { name: 'Atividade recente' })).toContainText(
      'Link criado',
    )
    await expect(page.getByRole('region', { name: 'Atividade recente' })).toContainText(
      'Versão editada',
    )
    await expect(page.getByText('Gerações com IA', { exact: true }).locator('..')).toContainText(
      '1',
    )

    await recent.getByRole('link', { name: 'Ver todas' }).click()
    await expect(page).toHaveURL('/propostas')
    await expect(page.getByRole('heading', { level: 1, name: 'Propostas' })).toBeVisible()
    await page.getByRole('searchbox', { name: 'Buscar propostas' }).fill(title)
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await page.getByRole('button', { name: 'Compartilhar' }).click()
  })

  const visitor = await browser.newContext()
  const publicPage = await visitor.newPage()

  await test.step('open the shared proposal without an account', async () => {
    await publicPage.goto(shareUrl)

    await expect(publicPage.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(publicPage.getByText('Padaria Pão Quente')).toBeVisible()
    await expect(publicPage.getByRole('heading', { name: 'Observações do e2e' })).toBeVisible()
    await expect(publicPage.getByRole('link', { name: 'Editar' })).toHaveCount(0)
  })

  await test.step('revoke the link and see it stop working', async () => {
    const dialog = page.getByRole('dialog', { name: 'Compartilhar proposta' })
    await dialog.getByRole('button', { name: 'Revogar' }).click()
    await dialog.getByRole('button', { name: 'Confirmar' }).click()
    await expect(page.getByText('Link revogado')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('link', { name: 'Início', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Links de compartilhamento' })).toContainText(
      'Nenhum link ativo',
    )
    await expect(page.getByRole('region', { name: 'Atividade recente' })).toContainText(
      'Link revogado',
    )
    await expect(page.getByRole('region', { name: 'Propostas recentes' })).toContainText('Editada')

    await publicPage.reload()
    await expect(
      publicPage.getByRole('heading', { name: 'Este link não está disponível' }),
    ).toBeVisible()
  })

  await test.step('opens the mobile navigation and switches the dashboard to dark mode', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    const trigger = page.getByRole('button', { name: 'Alternar menu lateral' })
    await trigger.click()
    const menu = page.getByRole('dialog', { name: 'Menu lateral' })
    await expect(menu.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    await expect(menu.getByRole('link', { name: 'Propostas', exact: true })).toBeVisible()
    await menu.getByRole('button', { name: new RegExp(email) }).click()
    await expect(page.getByRole('menuitem', { name: 'Minha conta' })).toBeVisible()
    await page.getByRole('menuitemradio', { name: 'Escuro' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await menu.getByRole('link', { name: 'Propostas', exact: true }).click()
    await expect(page).toHaveURL('/propostas')
    await expect(menu).not.toBeVisible()
  })

  await visitor.close()
})

test('an unknown share link shows the unavailable page', async ({ page }) => {
  await page.goto('/p/this-token-does-not-exist')

  await expect(page.getByRole('heading', { name: 'Este link não está disponível' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Imprimir / PDF' })).toHaveCount(0)
})
