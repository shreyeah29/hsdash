import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "node:path";
import * as path from "node:path";
import * as fs from "node:fs";
import * as XLSX from "xlsx";
import {
  LeadActivityKind,
  LeadEventType,
  LeadSource,
  LeadStatus,
  Role,
} from "@prisma/client";
import { prisma } from "../src/prisma/client";
import { normalizePhone, isValidPhone } from "../src/utils/phone";
import { parseDayUtc } from "../src/utils/calendarDay";

config({ path: resolve(__dirname, "../.env"), override: true });

type RawLead = Record<string, unknown>;

function cell(row: RawLead, ...keys: string[]) {
  for (const key of keys) {
    if (key in row && row[key] != null) return String(row[key]).trim();
  }
  // Fuzzy: trim trailing spaces in sheet headers
  for (const [k, v] of Object.entries(row)) {
    const nk = k.trim().toLowerCase();
    if (keys.some((want) => want.trim().toLowerCase() === nk)) {
      return String(v ?? "").trim();
    }
  }
  return "";
}

function parseUsOrIsoDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTimestamp(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  // e.g. 3/21/2026 10:45:47
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  const month = Number(m[1]) - 1;
  const day = Number(m[2]);
  const hour = Number(m[4] ?? 12);
  const minute = Number(m[5] ?? 0);
  const second = Number(m[6] ?? 0);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

function mapStatus(statusRaw: string, notesRaw: string): LeadStatus {
  const status = statusRaw.toUpperCase().trim();
  const notes = notesRaw.toUpperCase();

  if (status.includes("LOST")) return LeadStatus.LOST;
  if (status.includes("QUOTATION") || status.includes("NEGOTIATION")) return LeadStatus.NEGOTIATION;
  if (status.includes("SPOKE") || status.includes("CONTACT")) return LeadStatus.CONTACTED;
  if (status.includes("NO RESPONSE")) return LeadStatus.CONTACTED;
  if (status.includes("NEW")) return LeadStatus.NEW;
  if (status.includes("CONFIRM") || status.includes("BOOK")) return LeadStatus.CONFIRMED;

  if (notes.includes("NUMBER DOESNT EXIST") || notes.includes("NUMBER DOESN'T EXIST")) {
    return LeadStatus.LOST;
  }
  if (
    notes.includes("NOT RESPONDING") ||
    notes.includes("NO RESPONSE") ||
    notes.includes("MSG DROPPED") ||
    notes.includes("MESSAGE DROPPED")
  ) {
    return LeadStatus.CONTACTED;
  }
  if (notes.includes("SPOKE") || notes.includes("DONE") || notes.includes("MESSAGE SENT")) {
    return LeadStatus.CONTACTED;
  }

  return LeadStatus.NEW;
}

function mapEventType(raw: string): LeadEventType {
  return raw.trim().toUpperCase() === "OTHER" ? LeadEventType.OTHER : LeadEventType.WEDDING;
}

async function resolveActorUserId() {
  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true },
  });
  if (!admin) throw new Error("No admin user found to attribute import notes/activity");
  return admin;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/importLeadsFromAppSheet.ts <file.xlsx>");
    process.exit(1);
  }

  const filePath = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => n.trim().toUpperCase() === "LEADS");
  if (!sheetName) {
    console.error(`No LEADS sheet found. Sheets: ${wb.SheetNames.join(", ")}`);
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json<RawLead>(wb.Sheets[sheetName]!, { defval: "", raw: false });
  const actor = await resolveActorUserId();
  console.log(`Importing ${rows.length} rows from sheet "${sheetName}" as ${actor.username}`);

  let created = 0;
  let skipped = 0;
  let notesAdded = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNo = i + 2; // header is row 1
    const name = cell(row, "NAME ", "NAME", "Name");
    const email = cell(row, "Email Address", "EMAIL", "Email");
    const phone = cell(row, "PHONE ", "PHONE", "Phone");
    const eventDateRaw = cell(row, "EVENT DATE", "Event Date");
    const eventLocation = cell(row, "EVENT LOCATION", "Event Location") || "TBD";
    const eventTypeRaw = cell(row, "EVENT TYPE", "Event Type");
    const message = cell(row, "TELL US ABOUT YOUR EVENT", "Message");
    const pkg = cell(row, "PACKAGE ", "PACKAGE", "Package");
    const notes = cell(row, "NOTES", "Notes");
    const statusRaw = cell(row, "STATUS", "Status");
    const timestampRaw = cell(row, "Timestamp", "TIMESTAMP");

    if (!name && !phone && !email) {
      skipped += 1;
      continue;
    }
    if (!phone || !isValidPhone(phone)) {
      errors.push(`row ${rowNo}: invalid phone "${phone}" (${name || "unnamed"})`);
      continue;
    }
    const eventDate = parseUsOrIsoDate(eventDateRaw);
    if (!eventDate) {
      errors.push(`row ${rowNo}: invalid event date "${eventDateRaw}" (${name || phone})`);
      continue;
    }

    const phoneNormalized = normalizePhone(phone);
    const eventDateUtc = parseDayUtc(eventDate);
    const existing = await prisma.lead.findFirst({
      where: { phoneNormalized, eventDate: eventDateUtc },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      console.log(`skip duplicate phone+date: ${name || phone} ${eventDate}`);
      continue;
    }

    const eventType = mapEventType(eventTypeRaw);
    const status = mapStatus(statusRaw, notes);
    const createdAt = parseTimestamp(timestampRaw) ?? new Date();
    const messageParts = [message];
    if (pkg) messageParts.push(`Package: ${pkg}`);
    if (statusRaw) messageParts.push(`AppSheet status: ${statusRaw}`);

    try {
      const lead = await prisma.$transaction(async (tx) => {
        const createdLead = await tx.lead.create({
          data: {
            status,
            source: LeadSource.WEBSITE,
            eventType,
            name,
            email,
            phoneNumber: phone,
            phoneNormalized,
            eventDate: eventDateUtc,
            eventLocation,
            brideName: "",
            groomName: "",
            clientName: eventType === LeadEventType.OTHER ? name : "",
            message: messageParts.filter(Boolean).join("\n\n"),
            createdAt,
          },
        });
        await tx.leadActivity.create({
          data: {
            leadId: createdLead.id,
            kind: LeadActivityKind.CREATED,
            message: "Lead imported from AppSheet LEADS sheet",
            actorUserId: actor.id,
          },
        });
        if (notes) {
          await tx.leadNote.create({
            data: { leadId: createdLead.id, content: notes, authorId: actor.id },
          });
          await tx.leadActivity.create({
            data: {
              leadId: createdLead.id,
              kind: LeadActivityKind.NOTE_ADDED,
              message: notes.slice(0, 200),
              actorUserId: actor.id,
            },
          });
          notesAdded += 1;
        }
        return createdLead;
      });
      created += 1;
      console.log(`+ ${lead.name || lead.phoneNumber} · ${eventDate} · ${status}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`row ${rowNo}: ${msg}`);
    }
  }

  console.log("\n=== Import summary ===");
  console.log(`created: ${created}`);
  console.log(`skipped: ${skipped}`);
  console.log(`notes:   ${notesAdded}`);
  console.log(`errors:  ${errors.length}`);
  for (const err of errors) console.error(`  - ${err}`);

  if (errors.length && created === 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
