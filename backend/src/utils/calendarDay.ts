/** Interpret YYYY-MM-DD as that calendar day at noon UTC (stable across timezones). */
export function parseDayUtc(day: string) {
  return new Date(`${day}T12:00:00.000Z`);
}
