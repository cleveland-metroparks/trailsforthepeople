import { expect, test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@smoke @keyboard @a11y keyboard and focus behavior', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test('@smoke @keyboard sidebar tabs are keyboard-operable', async ({ page }) => {
    const parksTab = page.getByRole('tab', { name: 'Parks' })
    await parksTab.focus()
    await parksTab.press('Enter')
    await expect(page.getByRole('button', { name: 'Close panel' })).toBeVisible()
  })

  test('@smoke @keyboard opening panel focuses primary control', async ({ page }) => {
    const searchTab = page.getByRole('tab', { name: 'Search' })
    await searchTab.focus()
    await searchTab.press('Enter')
    const searchInput = page.locator('#search-panel-input')
    await expect(searchInput).toBeVisible()
    await searchInput.focus()
    await expect(searchInput).toBeFocused()
  })

  test('@smoke @keyboard detail back restores focus to previous list row', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    const firstParkRow = page.getByRole('button', { name: /View details for Alpha Park/i })
    await firstParkRow.click()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(firstParkRow).toBeFocused()
  })

  test('@smoke @keyboard closing panel keeps triggering tab reachable', async ({ page }) => {
    const parksTab = page.getByRole('tab', { name: 'Parks' })
    await parksTab.click()
    await page.getByRole('button', { name: 'Close panel' }).click()
    await expect(parksTab).toBeVisible()
  })
})
