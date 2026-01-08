import type { Attraction, TransformedAttraction, Trail, TransformedTrail, Activity } from '../types/api'

/**
 * Convert string representations of booleans into actual booleans.
 * Handles "Yes", "No", "True", "False", "1", "0", etc.
 */
export function strToBool(str: string | boolean | number | null | undefined): boolean {
  if (typeof str === 'boolean') return str
  if (typeof str === 'number') return str !== 0

  switch (str) {
    case 'Yes':
    case 'yes':
    case 'True':
    case 'true':
    case '1':
      return true
    case 'No':
    case 'no':
    case 'False':
    case 'false':
    case '0':
    case '':
    case null:
    case undefined:
    default:
      return false
  }
}

/**
 * Get activity icon file path from activity ID
 * Based on the activity_icon_filepath function from data.js
 */
export function getActivityIcon(activityId: number): string | null {
  const iconsDir = '/images/activities/'
  const activityTypeIconsById: Record<number, string> = {
    1: 'bike', // Biking & Cycling
    2: 'swim', // Swimming
    3: 'boat', // Boating, Sailing & Paddlesports
    4: 'hike', // Hiking & Walking
    5: 'fish', // Fishing & Ice Fishing
    6: 'archery', // Archery
    7: 'xcski', // Cross-Country Skiing
    9: 'geocache', // Geocaching
    11: 'horse', // Horseback Riding
    12: 'mtnbike', // Mountain Biking
    13: 'picnic', // Picnicking
    14: '', // Races & Competitions
    15: 'sled', // Sledding
    16: 'snowshoe', // Snowshoeing
    17: '', // Tobogganing
    18: '', // Rope Courses & Zip Lines
    19: 'geology', // Exploring Nature
    20: 'history', // Exploring Culture & History
    21: 'dine', // Dining
    22: '', // Classes, Workshops, & Lectures
    23: 'leafman', // Special Events & Programs
    24: '', // Concerts & Movies
    25: 'fitness', // Fitness Circuit
    26: '', // Disc Golf
    30: 'golf', // Golfing
    39: 'fitness', // Exercising
    41: '', // FootGolf

    1147: 'golf', // Golfing
    1320: 'archery', // Archery
    1325: '', // Backpacking
    1326: 'bike', // Biking & Cycling
    1329: 'boat', // Boating Sailing & Paddlesports
    1528: '', // Climbing
    1529: 'dine', // Dining
    1530: 'history', // Exploring Culture & History
    1531: 'geology', // Exploring Nature
    1532: 'fish', // Fishing & Ice Fishing
    1534: 'hike', // Hiking & Walking
    1535: 'horse', // Horseback Riding
    1536: 'mtnbike', // Mountain Biking
    1538: 'picnic', // Picnicking
    1540: '', // Rope Courses & Zip Lines
    1541: 'sled', // Sledding
    1542: 'swim', // Swimming
    1543: '', // Tobogganing
    1544: '', // Winter Activities
  }

  const filename = activityTypeIconsById[activityId] || 'leafman'
  if (filename) {
    return `${iconsDir}${filename}.svg`
  }
  return null
}

/**
 * Transform an attraction by splitting pipe-delimited strings into arrays
 */
export function transformAttraction(attraction: Attraction): TransformedAttraction {
  return {
    ...attraction,
    categories: attraction.categories
      ? typeof attraction.categories === 'string'
        ? attraction.categories.split('|').map(Number)
        : Array.isArray(attraction.categories)
          ? attraction.categories
          : null
      : null,
    activities: attraction.activities
      ? typeof attraction.activities === 'string'
        ? attraction.activities.split('|').map(Number)
        : Array.isArray(attraction.activities)
          ? attraction.activities
          : null
      : null,
  }
}

/**
 * Transform a trail by converting string booleans to actual booleans
 */
export function transformTrail(trail: Trail): TransformedTrail {
  return {
    ...trail,
    bike: strToBool(trail.bike),
    hike: strToBool(trail.hike),
    bridle: strToBool(trail.bridle),
    mountainbike: strToBool(trail.mountainbike),
  }
}

/**
 * Transform an activity by adding its icon path
 */
export function transformActivity(activity: Activity): Activity & { icon: string | null } {
  return {
    ...activity,
    icon: getActivityIcon(activity.eventactivitytypeid),
  }
}

/**
 * Filter attractions by activity IDs
 * Returns attractions that have ALL of the specified activities (AND logic)
 */
export function filterAttractionsByActivity(
  attractions: TransformedAttraction[],
  activityIds: number | number[]
): TransformedAttraction[] {
  // Normalize to array
  const ids = Array.isArray(activityIds) ? activityIds : [activityIds]
  // Ensure all are numbers
  const numericIds = ids.map(Number)

  return attractions.filter((attraction) => {
    if (!attraction.activities || attraction.activities.length === 0) {
      return false
    }

    // Check if ALL searched-for activities are in this attraction's list
    return numericIds.every((id) => attraction.activities!.includes(id))
  })
}

/**
 * Make image from pagethumbnail
 * (Based on make_image_from_pagethumbnail in mobile.js)
 *
 * Take an image URL path (called pagethumbnail in the database) referring to an image on the main site, like:
 * ~/getmedia/6cb586c0-e293-4ffa-b6c2-0be8904856b2/North_Chagrin_thumb_01.jpg.ashx?width=1440&height=864&ext=.jpg
 * and turn it into an absolute URL, scaled proportionately to the width provided.
 *
 * We double the requested image size, for retina displays.
 *
 * @param url_str string
 * @param new_width int: New image width, in pixels
 *
 * @return object with src, width, and height (ready to become <img>)
 */
export function makeImageFromPagethumbnail(
  url_str: string | null | undefined,
  new_width: number
): { src: string; width: number; height: number } | null {
  if (!url_str) return null

  const main_site_url = 'https://www.clevelandmetroparks.com/'
  const url_str_processed = url_str.replace('~/', main_site_url)

  try {
    const url = new URL(url_str_processed)

    const orig_width = url.searchParams.get('width')
    const orig_height = url.searchParams.get('height')

    if (!orig_width || !orig_height) return null

    const orig_width_num = parseInt(orig_width, 10)
    const orig_height_num = parseInt(orig_height, 10)

    if (isNaN(orig_width_num) || isNaN(orig_height_num)) return null

    const newParams = new URLSearchParams(url.searchParams)
    const new_height = Math.round(orig_height_num / (orig_width_num / new_width))
    // Doubled, for retina displays
    newParams.set('width', String(2 * new_width))
    newParams.set('height', String(2 * new_height))

    const new_url =
      url.protocol +
      '//' +
      url.hostname +
      url.pathname +
      '?' +
      newParams.toString()

    return {
      src: new_url,
      width: new_width,
      height: new_height,
    }
  } catch (e) {
    console.error('Error processing pagethumbnail URL:', e)
    return null
  }
}
