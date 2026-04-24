import { expect, test } from '@playwright/test'
import { setupMockApi } from './helpers/mockApi'

test.beforeEach(async ({ page }) => {
  await setupMockApi(page)
})

test('sidebar tabs and panel focus restore are keyboard-operable', async ({ page }) => {
  await page.goto('/')

  const parksTab = page.getByRole('tab', { name: 'Parks' })
  await expect(parksTab).toBeVisible()

  await parksTab.focus()
  await parksTab.press('Enter')

  const closeButton = page.getByRole('button', { name: 'Close panel' })
  await expect(closeButton).toBeVisible()

  const firstParkRow = page.getByRole('button', { name: /View details for/i }).first()
  await expect(firstParkRow).toBeVisible()

  await firstParkRow.focus()
  await firstParkRow.press('Enter')

  const backButton = page.getByRole('button', { name: 'Back' })
  await expect(backButton).toBeVisible()
  await expect(backButton).toBeFocused()

  await backButton.press('Enter')
  await expect(firstParkRow).toBeFocused()

  await closeButton.click()
  await expect(closeButton).not.toBeVisible()
  await expect(parksTab).toBeVisible()
})

test('search input exposes combobox semantics', async ({ page }) => {
  await page.goto('/')

  const searchTab = page.getByRole('tab', { name: 'Search' })
  await searchTab.focus()
  await searchTab.press('Enter')

  const searchInput = page.locator('#search-panel-input')
  await expect(searchInput).toBeVisible()
  await expect(searchInput).toHaveAttribute('role', 'combobox')
  await expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox')
})
