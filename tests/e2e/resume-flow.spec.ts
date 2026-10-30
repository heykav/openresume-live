import { expect, test } from '@playwright/test'

test.describe('OpenResume Live editor', () => {
  test('edits a profile and reflects changes in the portfolio preview', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible()
    await page.getByLabel('Full name').fill('Avery Brooks')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Avery Brooks.' })).toBeVisible()
  })

  test('switches sections, adds a role, and opens the resume layout', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Experience' }).click()
    await page.getByRole('button', { name: 'Add role' }).click()
    await page.getByLabel('Position').last().fill('Design director')
    if ((page.viewportSize()?.width ?? 0) <= 760) {
      await page.getByRole('button', { name: 'See preview' }).click()
    }
    await expect(page.getByRole('heading', { name: 'Design director' })).toBeVisible()
    await page.getByRole('button', { name: 'Resume', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Maya Chen' })).toBeVisible()
  })
})
