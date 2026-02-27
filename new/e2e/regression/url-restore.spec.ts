import { expect, test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@regression @url URL restore and deep-linking', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
  })

  test('@regression @url loading deep link restores selected feature detail pane', async ({ page }) => {
    await page.goto('/?type=park&gid=1')
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expect(page).toHaveURL(/type=park/)
    await expect(page).toHaveURL(/gid=1/)
  })

  test('@regression @url loading deep link restores map center and zoom params', async ({ page }) => {
    await page.goto('/?lat=41.5123000&lng=-81.6123000&zoom=13.0&base=map&type=park&gid=1')
    await expect(page).toHaveURL(/lat=41\.5123000/)
    await expect(page).toHaveURL(/lng=-81\.6123000/)
    await expect(page).toHaveURL(/zoom=13\.0/)
    await expect(page).toHaveURL(/base=map/)
  })

  test('@regression @url reload preserves both map and feature URL systems together', async ({ page }) => {
    await page.goto('/?lat=41.5010000&lng=-81.7010000&zoom=12.0&base=map&type=park&gid=1')
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expect(page).toHaveURL(/lat=41\.5010000/)
    await expect(page).toHaveURL(/lng=-81\.7010000/)
    await expect(page).toHaveURL(/zoom=12\.0/)
    await expect(page).toHaveURL(/type=park/)
    await expect(page).toHaveURL(/gid=1/)
  })
})
