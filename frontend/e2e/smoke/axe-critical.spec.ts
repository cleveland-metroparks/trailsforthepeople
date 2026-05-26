import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@smoke @a11y axe critical checks', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test('@smoke @a11y search panel has no critical axe violations', async ({ page }) => {
    await page.getByRole('tab', { name: 'Search' }).click()
    await expect(page.locator('#search-panel-input')).toBeVisible()

    const results = await new AxeBuilder({ page }).include('.mantine-Tabs-panel').analyze()
    const criticalViolations = results.violations.filter((v) => v.impact === 'critical')
    expect(criticalViolations).toEqual([])
  })

  test('@smoke @a11y parks panel has no critical axe violations', async ({ page }) => {
    await page.getByRole('tab', { name: 'Parks' }).click()
    await expect(page.getByRole('button', { name: /View details for/i }).first()).toBeVisible()

    const results = await new AxeBuilder({ page }).include('.mantine-Tabs-panel').analyze()
    const criticalViolations = results.violations.filter((v) => v.impact === 'critical')
    expect(criticalViolations).toEqual([])
  })
})
