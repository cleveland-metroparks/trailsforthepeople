import { expect, test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@smoke @url URL state contract', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/?lat=41.5000000&lng=-81.7000000&zoom=11.0&base=map')
  })

  test('@smoke @url selecting a park writes type and gid URL params', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()

    await expect(page).toHaveURL(/type=park/)
    await expect(page).toHaveURL(/gid=1/)
    await expect(page).toHaveURL(/lat=41\.5000000/)
    await expect(page).toHaveURL(/lng=-81\.7000000/)
    await expect(page).toHaveURL(/zoom=11\.0/)
    await expect(page).toHaveURL(/base=map/)
  })

  test('@smoke @url tab switching clears feature params while preserving map params', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()
    await expect(page).toHaveURL(/type=park/)
    await expect(page).toHaveURL(/gid=1/)

    await page.getByRole('tab', { name: 'Activities' }).click()
    await expect(page).not.toHaveURL(/type=park/)
    await expect(page).not.toHaveURL(/gid=1/)
    await expect(page).toHaveURL(/lat=41\.5000000/)
    await expect(page).toHaveURL(/lng=-81\.7000000/)
    await expect(page).toHaveURL(/zoom=11\.0/)
    await expect(page).toHaveURL(/base=map/)
  })

  test('@smoke @url search selection writes fromSearch and preserves map params', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()
    const input = page.locator('#search-panel-input')
    await input.fill('Alpha')
    await input.press('Enter')

    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()

    await expect(page).toHaveURL(/type=park/)
    await expect(page).toHaveURL(/gid=1/)
    await expect(page).toHaveURL(/fromSearch=true/)
    await expect(page).toHaveURL(/lat=41\.5000000/)
    await expect(page).toHaveURL(/lng=-81\.7000000/)
    await expect(page).toHaveURL(/zoom=11\.0/)
    await expect(page).toHaveURL(/base=map/)
  })
})
