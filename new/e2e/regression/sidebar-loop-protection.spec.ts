import { expect, test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@regression @sidebar sidebar loop protection', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test('@regression @sidebar closing panel does not immediately reopen from URL effect', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()
    await expect(page).toHaveURL(/type=park/)

    await page.getByRole('button', { name: 'Close panel' }).click()
    await expect(page.getByRole('button', { name: 'Close panel' })).not.toBeVisible()
    await expect(page).not.toHaveURL(/type=park/)
  })

  test('@regression @sidebar tab switching clears feature params without losing map params', async ({ page }) => {
    await page.goto('/?lat=41.49&lng=-81.69&zoom=12.0&base=map')
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()
    await expect(page).toHaveURL(/type=park/)

    await page.getByRole('tab', { name: 'Trails' }).click()
    await expect(page).not.toHaveURL(/type=park/)
    await expect(page).toHaveURL(/lat=41\.49/)
    await expect(page).toHaveURL(/lng=-81\.69/)
    await expect(page).toHaveURL(/zoom=12\.0/)
    await expect(page).toHaveURL(/base=map/)
  })

  test.fixme(
    '@regression @sidebar directions open and close request flow returns to expected tab',
    'Requires invoking DirectionsContext open/close request counters from feature detail CTAs.'
  )
})
