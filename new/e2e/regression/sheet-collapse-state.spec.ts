import { expect, test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

// All tests in this file require the mobile sheet (isMobile = window.innerWidth < 768).
test.use({ viewport: { width: 390, height: 844 } })

test.describe('@regression @mobile sheet collapse preserves nav state', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test('@regression @mobile show-on-map preserves URL feature params', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()
    await expect(page).toHaveURL(/type=park/)

    await page.getByRole('button', { name: 'Show on map' }).click()

    await expect(page).toHaveURL(/type=park/)
  })

  test('@regression @mobile show-on-map keeps Parks tab highlighted', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()

    await page.getByRole('button', { name: 'Show on map' }).click()

    await expect(page.getByRole('tab', { name: 'Parks' })).toHaveAttribute('aria-selected', 'true')
  })

  test('@regression @mobile tapping highlighted tab re-expands to same detail pane', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()
    await page.getByRole('button', { name: 'Show on map' }).click()

    // Sheet is now collapsed but Parks tab is still active — tap it again
    await page.getByRole('tab', { name: 'Parks' }).click()

    // Detail pane should be restored (Back button and Show on map are present in detail view)
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expect(page).toHaveURL(/type=park/)
  })

  test('@regression @mobile tapping a different tab while collapsed clears feature params', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()
    await page.getByRole('button', { name: 'Show on map' }).click()
    await expect(page).toHaveURL(/type=park/)

    await page.getByRole('tab', { name: 'Trails' }).click()

    await expect(page).not.toHaveURL(/type=park/)
    await expect(page.getByRole('tab', { name: 'Trails' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: 'Parks' })).toHaveAttribute('aria-selected', 'false')
  })

  test('@regression @mobile close button fully resets — no tab highlighted, params cleared', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await page.getByRole('button', { name: /View details for Alpha Park/i }).click()
    await expect(page).toHaveURL(/type=park/)

    await page.getByRole('button', { name: 'Close panel' }).click()

    await expect(page).not.toHaveURL(/type=park/)
    await expect(page.getByRole('tab', { name: 'Parks' })).toHaveAttribute('aria-selected', 'false')
  })

  test.fixme(
    '@regression @mobile swipe-down collapses sheet without clearing tab or params',
    'Requires reliable touch drag simulation (touchstart/touchmove/touchend with >80px delta). ' +
      'The "show-on-map" tests above cover the same state machine path.'
  )
})
