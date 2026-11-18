import { expect, test } from '@playwright/test'

test('anonymous visitors are sent to the login page', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Silver Proposals')
  await expect(page).toHaveURL(/\/entrar$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entrar')
})
