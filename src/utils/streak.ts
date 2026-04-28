/**
 * Day-streak math for the prediction game.
 *
 * A "streak" is the longest run of consecutive local-time days, ending
 * at today (or yesterday — see grace below), on which the user made at
 * least one prediction.
 *
 * Grace rule: if today has no prediction yet but yesterday did, the
 * streak still counts up from yesterday — so the user has all of "today"
 * to make their next call without losing their streak.
 */

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeDailyStreak(
  predictionTimestamps: number[],
  now: Date = new Date(),
): number {
  if (predictionTimestamps.length === 0) return 0;
  const dates = new Set(predictionTimestamps.map((ts) => localDateKey(new Date(ts))));

  let count = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  let grace = !dates.has(localDateKey(cursor));

  while (true) {
    const key = localDateKey(cursor);
    if (dates.has(key)) {
      count++;
      grace = false;
    } else if (grace) {
      grace = false;
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
