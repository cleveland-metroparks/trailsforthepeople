import type { Page, Route } from '@playwright/test'

function fulfillJson(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

export async function setupMockApi(page: Page) {
  // Keep tests deterministic and independent from remote API availability.
  await page.route('**/api/v1/reservations**', (route) =>
    fulfillJson(route, {
      data: [
        {
          record_id: 1,
          pagetitle: 'Alpha Park',
          latitude: 41.4,
          longitude: -81.7,
          descr: 'Mock park for keyboard accessibility tests.',
        },
      ],
    })
  )

  await page.route('**/api/v1/attractions**', (route) => fulfillJson(route, { data: [] }))
  await page.route('**/api/v1/activities**', (route) => fulfillJson(route, { data: [] }))
  await page.route('**/api/v1/trails**', (route) => fulfillJson(route, { data: [] }))
  await page.route('**/api/v1/categories**', (route) => fulfillJson(route, { data: [] }))
  await page.route('**/api/v1/reservation_boundaries**', (route) => fulfillJson(route, { data: [] }))

  // Avoid map-style network noise and keep focus tests isolated.
  await page.route('**://api.mapbox.com/**', (route) => route.abort())
  await page.route('**://events.mapbox.com/**', (route) => route.abort())
}
