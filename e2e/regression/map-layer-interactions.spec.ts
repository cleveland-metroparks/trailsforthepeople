import { test } from '@playwright/test'
import { setupMockApi } from '../helpers/mockApi'

test.describe('@regression @map map layer interactions', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page)
    await page.goto('/')
  })

  test.fixme(
    '@regression @map clicking allowed attraction layers selects feature',
    'Requires rendering real Mapbox style layers in E2E runtime.'
  )
  test.fixme(
    '@regression @map clicking attraction group layers zooms only',
    'Requires rendering real Mapbox style layers in E2E runtime.'
  )
  test.fixme(
    '@regression @map clicking non-clickable map areas does not set selection params',
    'Requires rendering real Mapbox style layers in E2E runtime.'
  )
})
