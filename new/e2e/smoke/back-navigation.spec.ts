import { expect, test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@smoke @history back-button flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test('@smoke @history parks list to detail to back restores URL and list view', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    const firstParkRow = page.getByRole('button', { name: /View details for Alpha Park/i })
    await firstParkRow.click()
    await expect(page).toHaveURL(/type=park/)
    await expect(page).toHaveURL(/gid=1/)

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).not.toHaveURL(/type=park/)
    await expect(firstParkRow).toBeFocused()
  })

  test('@smoke @history search-selected detail browser back returns to search results', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()
    const input = page.locator('#search-panel-input')
    await input.fill('Alpha')
    await input.press('Enter')

    const resultRow = page.getByRole('button', { name: /View details for Alpha Park/i })
    await resultRow.click()
    await expect(page).toHaveURL(/fromSearch=true/)

    await page.goBack()
    await expect(page).not.toHaveURL(/fromSearch=true/)
    await expect(resultRow).toBeVisible()
  })
})
