export type SeasonRange = {
  season_start: number | null;
  season_end: number | null;
};

/**
 * Compute the intersection of multiple season ranges.
 *
 * Rules:
 * - Ingredients with null/null (year-round) are ignored — they don't restrict the range.
 * - If ALL ingredients are year-round, the recipe is year-round (null/null).
 * - Seasons can wrap around December (e.g., season_start=11, season_end=2 = Nov–Feb).
 * - If the intersection is empty (incompatible ingredients), returns null/null.
 * - If the intersection is non-contiguous (rare edge case), returns null/null.
 */
export function intersectSeasons(seasons: SeasonRange[]): SeasonRange {
  const restricted = seasons.filter(
    (s): s is { season_start: number; season_end: number } =>
      s.season_start != null && s.season_end != null
  );

  if (restricted.length === 0) return { season_start: null, season_end: null };

  function monthSet(start: number, end: number): Set<number> {
    const s = new Set<number>();
    if (start <= end) {
      for (let m = start; m <= end; m++) s.add(m);
    } else {
      // Wrapping season e.g. 11→2 = Nov, Dec, Jan, Feb
      for (let m = start; m <= 12; m++) s.add(m);
      for (let m = 1; m <= end; m++) s.add(m);
    }
    return s;
  }

  let intersection = monthSet(restricted[0].season_start, restricted[0].season_end);
  for (let i = 1; i < restricted.length; i++) {
    const next = monthSet(restricted[i].season_start, restricted[i].season_end);
    intersection = new Set([...intersection].filter((m) => next.has(m)));
  }

  if (intersection.size === 0) return { season_start: null, season_end: null };

  const months = Array.from(intersection).sort((a, b) => a - b);

  // Find gaps in the sorted month array
  const gapIndices: number[] = [];
  for (let i = 0; i < months.length - 1; i++) {
    if (months[i + 1] !== months[i] + 1) gapIndices.push(i);
  }

  if (gapIndices.length === 0) {
    // Simple contiguous range (no wrapping)
    return { season_start: months[0], season_end: months[months.length - 1] };
  } else if (gapIndices.length === 1) {
    // One gap = wrapping range e.g. [1, 2, 11, 12] → season 11–2
    const gapIdx = gapIndices[0];
    return { season_start: months[gapIdx + 1], season_end: months[gapIdx] };
  } else {
    // Multiple gaps → incompatible seasons
    return { season_start: null, season_end: null };
  }
}
