import { expect, test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@smoke @search core search behavior', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test('@smoke @search search panel input and autocomplete are keyboard-operable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()

    const input = page.locator('#search-panel-input')
    await expect(input).toBeVisible()
    await input.fill('Al')
    await expect(page.locator('[role="listbox"] [role="option"]').first()).toBeVisible()
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(page).toHaveURL(/fromSearch=true/)
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
  })

  test('@smoke @search selecting autocomplete option opens detail with fromSearch=true', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()
    const input = page.locator('#search-panel-input')
    await input.fill('Al')
    await expect(page.locator('[role="listbox"] [role="option"]').first()).toBeVisible()
    await input.press('ArrowDown')
    await input.press('Enter')

    await expect(page).toHaveURL(/type=park/)
    await expect(page).toHaveURL(/gid=1/)
    await expect(page).toHaveURL(/fromSearch=true/)
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
  })

  test('@smoke @search search results list rows are tabbable and activatable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()
    const input = page.locator('#search-panel-input')
    await input.fill('Alpha')
    await input.press('Enter')

    const resultRow = page.getByRole('button', { name: /View details for Alpha Park/i })
    await expect(resultRow).toBeVisible()
    await resultRow.focus()
    await expect(resultRow).toBeFocused()
    await resultRow.press('Enter')

    await expect(page).toHaveURL(/fromSearch=true/)
  })
})
