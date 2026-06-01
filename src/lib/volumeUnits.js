/**
 * Shared definitions for the Million-tonnes ↔ Billion-lbs volume toggle used on
 * the production/volume charts across the dashboard.
 *
 * 1 tonne = 2204.6226 lb, so 1 million tonnes = 2.2046226 billion lb.
 * Raw lbs would be tens of billions (unreadable), so the imperial unit is
 * expressed in "Billion lbs".
 */
export const MT_TO_BLB = 2.2046226

export const VOL_UNITS = [
  { value: 'mt', label: 'Million tonnes' },
  { value: 'blb', label: 'Billion lbs' },
]

/** Resolve a unit code into the multiplier + axis label charts should use. */
export function volMeta(unit) {
  const factor = unit === 'blb' ? MT_TO_BLB : 1
  const volLabel = unit === 'blb' ? 'Billion lbs' : 'Million tonnes'
  return { factor, volLabel }
}
