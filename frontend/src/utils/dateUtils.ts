/**
 * Returns today's date as a YYYY-MM-DD string in the user's local timezone.
 * Avoids the timezone offset bug of `new Date().toISOString().split('T')[0]`.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().split('T')[0];
}
