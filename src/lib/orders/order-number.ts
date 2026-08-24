/** Human-readable order number, e.g. LM-20260824-K3F9X2. Not used as a DB key. */
export function generateOrderNumber(now: Date = new Date()): string {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LM-${datePart}-${randomPart}`;
}
