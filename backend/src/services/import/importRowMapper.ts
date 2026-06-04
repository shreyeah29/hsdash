import type { ShootEntryCreateInput } from "../shootCalendarEntryService";

export type MappedImportRow = {
  rowNumber: number;
  sheetName: string;
  input: ShootEntryCreateInput;
  clientKey: string;
  duplicateKey: string;
  warnings: string[];
};

const COL = {
  clientName: ["client name", "client names", "client"],
  phone: ["phone", "phone number", "mobile", "contact number", "client phone"],
  clientContact: ["client contact", "contact", "email"],
  city: ["city"],
  eventName: ["event name", "event"],
  clientType: ["type of client", "client type", "type"],
  venue: ["venue", "location"],
  date: ["date", "day", "shoot date"],
  photoTeam: ["photo team", "team - photo", "team photo", "on-site photo"],
  videoTeam: ["video team", "team - video", "team video", "on-site video"],
  startTime: ["start time", "time"],
  endTime: ["end time"],
  muhurutham: ["muhurutham time", "muhurtham time"],
  addons: ["add on", "addons", "notes", "add on services if any", "deliverable commitment"],
};

function pick(row: Record<string, unknown>, aliases: string[]): string {
  for (const key of aliases) {
    if (key in row) {
      const v = cellToString(row[key]);
      if (v) return v;
    }
  }
  for (const [k, v] of Object.entries(row)) {
    if (aliases.some((a) => k.includes(a) || a.includes(k))) {
      const s = cellToString(v);
      if (s) return s;
    }
  }
  return "";
}

export function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number" && !Number.isFinite(value)) return "";
  if (typeof value === "number") {
    if (value > 20000 && value < 60000) return String(value);
    return String(value);
  }
  return String(value).replace(/\s+/g, " ").trim();
}

export function normalizeClientName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Digits-only phone for deduplication; empty if none. */
export function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return digits;
}

/**
 * Stable client key: real phone when present, otherwise legacy import key from name.
 * Legacy files without phone still dedupe by client identity.
 */
export function clientDedupKey(clientName: string, phoneRaw: string): { key: string; warnings: string[] } {
  const warnings: string[] = [];
  const phone = normalizePhoneDigits(phoneRaw);
  if (phone) return { key: `phone:${phone}`, warnings };

  const name = normalizeClientName(clientName).toLowerCase();
  if (!name) return { key: "", warnings: ["Client name missing"] };
  warnings.push("Phone missing — using legacy client key from name for this row");
  const slug = name.replace(/[^a-z0-9]+/g, "-").slice(0, 80);
  return { key: `legacy:${slug}`, warnings };
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function excelSerialToIso(n: number): string | null {
  if (n < 20000 || n > 60000) return null;
  const utc = Math.round((n - 25569) * 86400 * 1000);
  const d = new Date(utc);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function parseFlexibleDate(
  raw: string,
  ctx: { defaultYear: number | null; defaultMonth: number | null },
): string | null {
  const s = raw.trim();
  if (!s) return null;

  const num = Number(s);
  if (!Number.isNaN(num) && num > 20000 && num < 60000) {
    return excelSerialToIso(num);
  }

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${pad2(Number(iso[2]))}-${pad2(Number(iso[3]))}`;

  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    const day = a > 12 && b <= 12 ? a : b;
    const month = a > 12 && b <= 12 ? b : a <= 12 && b <= 12 ? b : a;
    return `${y}-${pad2(month)}-${pad2(day)}`;
  }

  const dayMonth = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{2,4}))?/i);
  if (dayMonth) {
    const day = Number(dayMonth[1]);
    const monKey = dayMonth[2].toLowerCase().slice(0, 3);
    const month = MONTH_NAMES[monKey] ?? MONTH_NAMES[dayMonth[2].toLowerCase()];
    if (!month) return null;
    let year = dayMonth[3] ? Number(dayMonth[3]) : ctx.defaultYear;
    if (year != null && year < 100) year += 2000;
    if (!year && ctx.defaultYear) year = ctx.defaultYear;
    if (!year) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const monthDay = s.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{2,4}))?/i);
  if (monthDay) {
    const monKey = monthDay[1].toLowerCase().slice(0, 3);
    const month = MONTH_NAMES[monKey];
    const day = Number(monthDay[2]);
    let year = monthDay[3] ? Number(monthDay[3]) : ctx.defaultYear;
    if (year != null && year < 100) year += 2000;
    if (!year && ctx.defaultYear) year = ctx.defaultYear;
    if (!month || !year) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  return null;
}

function parseExcelTimeFraction(n: number): string {
  const totalMinutes = Math.round(n * 24 * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad2(m)} ${period}`;
}

export function parseTimeCell(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const num = Number(s);
  if (!Number.isNaN(num) && num >= 0 && num < 1) return parseExcelTimeFraction(num);
  if (/^\d{1,2}(\.\d+)?\s*(am|pm)$/i.test(s) || /^\d{1,2}:\d{2}/i.test(s)) return s.toUpperCase();
  return s;
}

export function mapRowToShootInput(
  row: Record<string, unknown>,
  ctx: {
    sheetName: string;
    rowNumber: number;
    defaultYear: number | null;
    defaultMonth: number | null;
    lastDate: string | null;
    lastClientName: string | null;
    lastClientType: string | null;
    lastCity: string | null;
  },
): { mapped: MappedImportRow | null; errors: string[]; lastDate: string | null; lastClientName: string | null; lastClientType: string | null; lastCity: string | null } {
  const errors: string[] = [];
  const warnings: string[] = [];

  let clientName = pick(row, COL.clientName);
  let clientType = pick(row, COL.clientType);
  let city = pick(row, COL.city);
  const eventName = pick(row, COL.eventName);
  const venue = pick(row, COL.venue);
  const phoneRaw = pick(row, COL.phone);
  const clientContact = pick(row, COL.clientContact);
  const photoTeam = pick(row, COL.photoTeam);
  const videoTeam = pick(row, COL.videoTeam);
  const startTime = parseTimeCell(pick(row, COL.startTime));
  const endTime = parseTimeCell(pick(row, COL.endTime));
  const muhuruthamTime = parseTimeCell(pick(row, COL.muhurutham));
  const addons = [pick(row, COL.addons)].filter(Boolean).join("\n");

  let dateRaw = pick(row, COL.date);
  let lastDate = ctx.lastDate;
  let lastClientName = ctx.lastClientName;
  let lastClientType = ctx.lastClientType;
  let lastCity = ctx.lastCity;

  if (!dateRaw && lastDate) dateRaw = lastDate;
  if (!clientName && lastClientName) clientName = lastClientName;
  if (!clientType && lastClientType) clientType = lastClientType;
  if (!city && lastCity) city = lastCity;

  if (!clientName && !eventName && !dateRaw) {
    return { mapped: null, errors: [], lastDate, lastClientName, lastClientType, lastCity };
  }

  if (!clientName) errors.push("Client name missing");
  if (!eventName) errors.push("Event name missing");

  const day = parseFlexibleDate(dateRaw, {
    defaultYear: ctx.defaultYear,
    defaultMonth: ctx.defaultMonth,
  });
  if (!day) errors.push(`Invalid date: ${dateRaw || "(empty)"}`);

  const { key: clientKey, warnings: keyWarnings } = clientDedupKey(clientName, phoneRaw || clientContact);
  warnings.push(...keyWarnings);

  if (errors.length > 0 || !day || !clientKey) {
    return { mapped: null, errors, lastDate, lastClientName, lastClientType, lastCity };
  }

  const phoneDigits = normalizePhoneDigits(phoneRaw || clientContact);
  const phoneNumber = phoneDigits || (clientKey.startsWith("legacy:") ? clientKey : `legacy:${clientKey}`);

  const input: ShootEntryCreateInput = {
    day,
    clientName: normalizeClientName(clientName),
    phoneNumber,
    clientType,
    clientContact: normalizePhoneDigits(phoneRaw) ? clientContact : clientContact || "",
    city,
    eventName,
    venue,
    startTime,
    endTime,
    muhuruthamTime,
    photoTeam,
    videoTeam,
    addons,
    createDeliverableTimeline: false,
  };

  const duplicateKey = `${clientKey}|${day}|${eventName.trim().toLowerCase()}`;

  lastDate = day;
  if (clientName) lastClientName = normalizeClientName(clientName);
  if (clientType) lastClientType = clientType;
  if (city) lastCity = city;

  return {
    mapped: {
      rowNumber: ctx.rowNumber,
      sheetName: ctx.sheetName,
      input,
      clientKey,
      duplicateKey,
      warnings,
    },
    errors: [],
    lastDate,
    lastClientName,
    lastClientType,
    lastCity,
  };
}
