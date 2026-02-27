import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { setupMockApi } from './helpers/mockApi'

test.beforeEach(async ({ page }) => {
  await setupMockApi(page)
})

test('sidebar panel has no critical axe violations', async ({ page }) => {
  await page.goto('/')

  const searchTab = page.getByRole('tab', { name: 'Search' })
  await expect(searchTab).toBeVisible()
  await searchTab.click()
  await expect(page.locator('#search-panel-input')).toBeVisible()

  const accessibilityScanResults = await new AxeBuilder({ page })
    .include('.mantine-Tabs-panel')
    .analyze()

  const criticalViolations = accessibilityScanResults.violations.filter(
    (violation) => violation.impact === 'critical'
  )

  expect(criticalViolations).toEqual([])
})
