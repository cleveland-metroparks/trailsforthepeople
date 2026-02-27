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
          boxw: -81.8,
          boxs: 41.3,
          boxe: -81.6,
          boxn: 41.5,
          latitude: 41.4,
          longitude: -81.7,
          descr: 'Mock park for keyboard accessibility tests.',
        },
        {
          record_id: 2,
          pagetitle: 'Beta Park',
          latitude: 41.42,
          longitude: -81.68,
          descr: 'Second park to support list and search flows.',
        },
      ],
    })
  )

  await page.route('**/api/v1/attractions**', (route) =>
    fulfillJson(route, {
      data: [
        {
          gis_id: 101,
          record_id: 101,
          pagetitle: 'Mock Marina',
          latitude: 41.405,
          longitude: -81.705,
          reservation: 1,
          activities: '1|4',
          categories: '10',
          descr: 'Mock attraction for testing.',
        },
      ],
    })
  )

  await page.route('**/api/v1/activities**', (route) =>
    fulfillJson(route, {
      data: [
        { eventactivitytypeid: 1, pagetitle: 'Biking & Cycling' },
        { eventactivitytypeid: 4, pagetitle: 'Hiking & Walking' },
      ],
    })
  )

  await page.route('**/api/v1/trails**', (route) =>
    fulfillJson(route, {
      data: [
        {
          id: 201,
          name: 'Ridge Trail',
          status: 1,
          lat: 41.41,
          lng: -81.69,
          res: 'Alpha Park',
          bike: 'Yes',
          hike: 'Yes',
          bridle: 'No',
          mountainbike: 'No',
          distancetext: '2 Miles',
          description: 'Mock trail for testing.',
        },
      ],
    })
  )

  await page.route('**/api/v1/categories**', (route) =>
    fulfillJson(route, {
      data: [{ categorytypeid: 10, name: 'Water Access' }],
    })
  )

  await page.route('**/api/v1/reservation_boundaries**', (route) => fulfillJson(route, { data: [] }))
  await page.route('**/api/v1/trail_geometries/**', (route) =>
    fulfillJson(route, {
      data: {
        geom_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [-81.7, 41.4],
            [-81.69, 41.41],
          ],
        }),
      },
    })
  )

  await page.route('**/api/v1/geocode/**', async (route) => {
    const url = route.request().url().toLowerCase()
    if (url.includes('unknown-place')) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      })
      return
    }

    await fulfillJson(route, {
      data: {
        title: 'Cleveland, OH',
        lat: 41.4993,
        lng: -81.6944,
      },
    })
  })

  await page.route('**/api/v1/directions_*', (route) =>
    fulfillJson(route, {
      data: {
        start: { lat: 41.4, lng: -81.7 },
        end: { lat: 41.405, lng: -81.705 },
        wkt: 'LINESTRING (-81.7 41.4, -81.705 41.405)',
        bounds: { west: -81.706, south: 41.399, east: -81.699, north: 41.406 },
        steps: [{ text: 'Head to destination' }],
        totals: { distance: '1 mi', duration: '5 min' },
      },
    })
  )

  // Avoid map-style network noise and keep focus tests isolated.
  await page.route('**://api.mapbox.com/**', (route) => route.abort())
  await page.route('**://events.mapbox.com/**', (route) => route.abort())
}
