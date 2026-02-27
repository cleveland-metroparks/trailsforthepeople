import { expect, test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@regression @search geocode fallback', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test('@regression @search no local results triggers geocode fallback request', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()
    await page.locator('#search-panel-input').fill('Cleveland')
    await page.locator('#search-panel-input').press('Enter')

    await expect(page.getByText('Results (1)')).toBeVisible()
  })

  test('@regression @search geocode result zooms map without opening feature detail', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()
    await page.locator('#search-panel-input').fill('Cleveland')
    await page.locator('#search-panel-input').press('Enter')

    const resultRow = page.getByRole('button', { name: /View details for Cleveland, OH/i })
    await resultRow.click()

    await expect(page).not.toHaveURL(/fromSearch=true/)
    await expect(page.getByRole('button', { name: 'Back' })).not.toBeVisible()
  })

  test('@regression @search fallback error path shows user-facing message', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()
    await page.locator('#search-panel-input').fill('unknown-place')
    await page.locator('#search-panel-input').press('Enter')

    await expect(page.getByRole('alert', { name: 'Search Error' })).toContainText(
      "We couldn't find that address or city. Please try again."
    )
  })
})
