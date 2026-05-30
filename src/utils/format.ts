/**
 * Compact USD price formatter shared across cards and charts.
 * Scales to M/k for large values and keeps sub-dollar precision for
 * low-priced tokens. Nullish values render as an em dash.
 */
export function formatPriceShort(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  if (v >= 1) return `$${Math.round(v)}`;
  if (v >= 0.01) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}
