import { weddingKeyForEntry, normalizeClientLabel } from "@/lib/weddingsArchiveIndex";
import { calendarDayKeyFromIso } from "@/lib/calendarUtils";
import {
  effectiveClientContact,
  effectiveClientPhone,
  resolveShootClientName,
  type ShootClientProfile,
} from "@/types/shootClientProfile";
import type { ShootCalendarEntry } from "@/types/domain";

function shootDayKey(day: string) {
  return calendarDayKeyFromIso(day);
}

export function shootClientDisplayLabel(opts: { brideName: string; groomName: string; clientName: string }) {
  const b = opts.brideName.trim();
  const g = opts.groomName.trim();
  if (b && g) return `${b} & ${g}`;
  if (b) return b;
  if (g) return g;
  return opts.clientName.trim();
}

function meaningfulClientType(type: string) {
  const t = type.trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower === "wedding" || lower === "other") return "";
  return t;
}

export function shootClientProfileFromEntry(entry: ShootCalendarEntry): ShootClientProfile {
  const bride = entry.brideName?.trim() ?? "";
  const groom = entry.groomName?.trim() ?? "";
  const clientName = entry.clientName.trim();
  const rawPhone = entry.phoneNumber?.trim() ?? "";
  const rawContact = entry.clientContact?.trim() ?? "";
  const phone = effectiveClientPhone(rawPhone, rawContact);
  const contact = effectiveClientContact(rawPhone, rawContact);
  const city = entry.city?.trim() ?? "";
  const venue = entry.venue?.trim() ?? "";
  const type = meaningfulClientType(entry.clientType?.trim() ?? "");
  const isWedding =
    !!bride ||
    !!groom ||
    (entry.clientType?.toLowerCase().includes("wedding") ?? false) ||
    clientName.includes("&");

  const label = shootClientDisplayLabel({ brideName: bride, groomName: groom, clientName });

  return {
    id: weddingKeyForEntry(entry),
    displayLabel: label || clientName,
    clientName: clientName || label,
    clientType: type,
    clientContact: contact,
    city,
    venue,
    brideName: bride,
    groomName: groom,
    phoneNumber: phone,
    isWedding,
  };
}

function normalizeProfile(p: ShootClientProfile): ShootClientProfile {
  return {
    ...p,
    phoneNumber: effectiveClientPhone(p.phoneNumber, p.clientContact),
    clientContact: effectiveClientContact(p.phoneNumber, p.clientContact),
  };
}

function entryIsNewer(a: ShootCalendarEntry, b: ShootCalendarEntry) {
  return shootDayKey(a.day).localeCompare(shootDayKey(b.day)) >= 0;
}

export function shootClientProfilesFromEntries(entries: Iterable<ShootCalendarEntry>, search = "") {
  const byKey = new Map<string, ShootCalendarEntry>();
  for (const entry of entries) {
    const name = entry.clientName.trim();
    const bride = entry.brideName?.trim() ?? "";
    const groom = entry.groomName?.trim() ?? "";
    if (!name && !bride && !groom) continue;
    const key = weddingKeyForEntry(entry);
    const prev = byKey.get(key);
    if (!prev || entryIsNewer(entry, prev)) byKey.set(key, entry);
  }
  const list = [...byKey.values()]
    .map((e) => normalizeProfile(shootClientProfileFromEntry(e)))
    .sort((a, b) => a.displayLabel.localeCompare(b.displayLabel));
  return filterClientProfiles(list, search);
}

function profileSearchLabels(c: ShootClientProfile) {
  const labels = new Set([normalizeClientLabel(c.displayLabel), normalizeClientLabel(c.clientName)]);
  if (c.brideName || c.groomName) {
    labels.add(
      normalizeClientLabel(
        resolveShootClientName({ isWedding: true, brideName: c.brideName, groomName: c.groomName, clientName: "" }),
      ),
    );
    labels.add(normalizeClientLabel(`${c.brideName} ${c.groomName}`));
  }
  return [...labels].filter(Boolean);
}

export function profileMatchesQuery(profile: ShootClientProfile, query: string) {
  const needle = normalizeClientLabel(query);
  if (!needle) return false;
  for (const hay of profileSearchLabels(profile)) {
    if (hay === needle || hay.includes(needle) || needle.includes(hay)) return true;
    const words = needle.split(" ").filter((w) => w.length >= 2);
    if (words.length > 0 && words.every((w) => hay.includes(w))) return true;
  }
  return false;
}

export function filterClientProfiles(profiles: ShootClientProfile[], query: string, limit = 8) {
  if (!query.trim()) return [];
  const matches = profiles.filter((c) => profileMatchesQuery(c, query));
  return matches.length <= limit ? matches : matches.slice(0, limit);
}

export function resolveClientProfileForQuery(profiles: ShootClientProfile[], query: string) {
  const needle = normalizeClientLabel(query);
  if (needle.length < 3) return null;
  const matches = profiles.filter((c) => profileMatchesQuery(c, query));
  if (!matches.length) return null;
  for (const c of matches) {
    for (const label of profileSearchLabels(c)) {
      if (label === needle) return c;
    }
  }
  if (matches.length === 1) {
    const only = matches[0]!;
    for (const label of profileSearchLabels(only)) {
      if (label.startsWith(needle) && needle.length >= 6) return only;
    }
  }
  return null;
}

function profileMergeKey(p: ShootClientProfile) {
  const label = p.displayLabel || p.clientName;
  const key = normalizeClientLabel(label);
  return key || p.id;
}

function combineProfiles(base: ShootClientProfile, extra: ShootClientProfile): ShootClientProfile {
  return {
    id: base.id,
    displayLabel: base.displayLabel || extra.displayLabel,
    clientName: base.clientName || extra.clientName,
    clientType: base.clientType || extra.clientType,
    clientContact: base.clientContact || extra.clientContact,
    city: base.city || extra.city,
    venue: base.venue || extra.venue,
    brideName: base.brideName || extra.brideName,
    groomName: base.groomName || extra.groomName,
    phoneNumber: base.phoneNumber || extra.phoneNumber,
    isWedding: base.isWedding || extra.isWedding,
  };
}

export function mergeClientProfiles(primary: ShootClientProfile[], secondary: ShootClientProfile[]) {
  const byKey = new Map<string, ShootClientProfile>();
  for (const p of secondary) byKey.set(profileMergeKey(p), p);
  for (const p of primary) {
    const key = profileMergeKey(p);
    const prev = byKey.get(key);
    byKey.set(key, prev ? combineProfiles(p, prev) : p);
  }
  return [...byKey.values()].sort((a, b) => a.displayLabel.localeCompare(b.displayLabel));
}

export function profileFromApiJson(json: Record<string, unknown>): ShootClientProfile {
  const bride = String(json.brideName ?? "");
  const groom = String(json.groomName ?? "");
  const type = String(json.clientType ?? "");
  const clientName = String(json.clientName ?? "");
  const isWedding =
    !!bride.trim() ||
    !!groom.trim() ||
    type.toLowerCase().includes("wedding") ||
    clientName.includes("&");
  const rawPhone = String(json.phoneNumber ?? "");
  const rawContact = String(json.clientContact ?? "");
  return normalizeProfile({
    id: String(json.id ?? ""),
    displayLabel: String(json.displayLabel ?? clientName),
    clientName,
    clientType: type,
    clientContact: effectiveClientContact(rawPhone, rawContact),
    city: String(json.city ?? ""),
    venue: String(json.venue ?? ""),
    brideName: bride,
    groomName: groom,
    phoneNumber: effectiveClientPhone(rawPhone, rawContact),
    isWedding,
  });
}
