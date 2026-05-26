import { test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@regression @map @cleanup overlay cleanup behavior', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test.fixme(
    '@regression @cleanup park highlight is cleared when leaving park detail',
    'Requires map-style layer assertions against a running Mapbox style.'
  )
  test.fixme(
    '@regression @cleanup trail highlight is cleared on selection change and unmount',
    'Requires map-style layer assertions against a running Mapbox style.'
  )
  test.fixme(
    '@regression @cleanup attraction marker is cleared when switching to non-attraction features',
    'Requires map-style layer assertions against a running Mapbox style.'
  )
  test.fixme(
    '@regression @cleanup directions route and markers clear when closing directions',
    'Requires map-style layer assertions against a running Mapbox style.'
  )
})
