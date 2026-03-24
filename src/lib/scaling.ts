/**
 * Scale an ingredient quantity for a given number of display servings.
 *
 * Formula: qty_per_person * baseServings * (displayServings / baseServings) ^ scalingFactor
 *
 * - scalingFactor = 1.0 (linear):    total = qty_per_person * displayServings
 * - scalingFactor = 0.0 (fixed):     total = qty_per_person * baseServings (constant)
 * - scalingFactor ≈ 0.6 (sub-linear): scales slower than linear (spices, seasonings)
 */
export function scaleQuantity(
  qtyPerPerson: number,
  baseServings: number,
  displayServings: number,
  scalingFactor: number
): number {
  if (baseServings <= 0 || displayServings <= 0) return qtyPerPerson;
  const ratio = displayServings / baseServings;
  return qtyPerPerson * baseServings * Math.pow(ratio, scalingFactor);
}
