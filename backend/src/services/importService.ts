import { Role } from "@prisma/client";
import { prisma } from "../prisma/client";
import { createShootCalendarEntryTx, type ShootEntryCreateInput } from "./shootCalendarEntryService";
import { readSpreadsheet } from "./import/spreadsheetParser";
import { mapRowToShootInput, normalizeClientName, type MappedImportRow } from "./import/importRowMapper";

export type ImportLogLine = {
  rowNumber: number;
  sheetName: string;
  level: "error" | "warn" | "skip" | "info";
  message: string;
};

export type ImportSummary = {
  clientsCreated: number;
  clientsReused: number;
  eventsCreated: number;
  rowsSkipped: number;
  errors: number;
  warnings: number;
  logs: ImportLogLine[];
};

type ClientProfile = {
  clientName: string;
  clientType: string;
  clientContact: string;
  city: string;
  phoneNumber: string;
};

function phoneStorageKey(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length >= 8) return `phone:${digits}`;
  if (phoneNumber.startsWith("legacy:")) return phoneNumber;
  return `legacy:${phoneNumber}`;
}

function applyExistingClientProfile(input: ShootEntryCreateInput, profile: ClientProfile): ShootEntryCreateInput {
  return {
    ...input,
    clientName: profile.clientName || input.clientName,
    clientType: profile.clientType || input.clientType,
    clientContact: profile.clientContact || input.clientContact,
    city: profile.city || input.city,
    phoneNumber: profile.phoneNumber || input.phoneNumber,
  };
}

export async function runShootDataImport(filePath: string): Promise<ImportSummary> {
  const logs: ImportLogLine[] = [];
  const summary: ImportSummary = {
    clientsCreated: 0,
    clientsReused: 0,
    eventsCreated: 0,
    rowsSkipped: 0,
    errors: 0,
    warnings: 0,
    logs,
  };

  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!admin) {
    throw new Error("No active ADMIN user found. Seed the database before importing.");
  }

  const sheets = readSpreadsheet(filePath);
  const mappedRows: MappedImportRow[] = [];
  const seenInFile = new Set<string>();

  for (const sheet of sheets) {
    let lastDate: string | null = null;
    let lastClientName: string | null = null;
    let lastClientType: string | null = null;
    let lastCity: string | null = null;

    sheet.rows.forEach((row, idx) => {
      const rowNumber = idx + 2;
      const result = mapRowToShootInput(row, {
        sheetName: sheet.sheetName,
        rowNumber,
        defaultYear: sheet.defaultYear,
        defaultMonth: sheet.defaultMonth,
        lastDate,
        lastClientName,
        lastClientType,
        lastCity,
      });

      lastDate = result.lastDate;
      lastClientName = result.lastClientName;
      lastClientType = result.lastClientType;
      lastCity = result.lastCity;

      for (const err of result.errors) {
        summary.errors += 1;
        logs.push({ rowNumber, sheetName: sheet.sheetName, level: "error", message: err });
      }

      if (!result.mapped) return;

      for (const w of result.mapped.warnings) {
        summary.warnings += 1;
        logs.push({ rowNumber, sheetName: sheet.sheetName, level: "warn", message: w });
      }

      if (seenInFile.has(result.mapped.duplicateKey)) {
        summary.rowsSkipped += 1;
        logs.push({
          rowNumber,
          sheetName: sheet.sheetName,
          level: "skip",
          message: "Duplicate row inside file (same client, date, and event)",
        });
        return;
      }
      seenInFile.add(result.mapped.duplicateKey);
      mappedRows.push(result.mapped);
    });
  }

  if (mappedRows.length === 0) {
    logs.push({ rowNumber: 0, sheetName: "-", level: "error", message: "No valid rows to import" });
    return summary;
  }

  const minDay = mappedRows.map((r) => r.input.day).sort()[0];
  const maxDay = mappedRows.map((r) => r.input.day).sort().at(-1)!;

  const existing = await prisma.shootCalendarEntry.findMany({
    where: {
      day: {
        gte: new Date(`${minDay}T00:00:00.000Z`),
        lte: new Date(`${maxDay}T23:59:59.999Z`),
      },
    },
    select: {
      day: true,
      clientName: true,
      phoneNumber: true,
      clientType: true,
      clientContact: true,
      city: true,
      eventName: true,
    },
  });

  const existingDuplicateKeys = new Set<string>();
  const clientProfiles = new Map<string, ClientProfile>();

  for (const e of existing) {
    const day = e.day.toISOString().slice(0, 10);
    const key = phoneStorageKey(e.phoneNumber || "");
    const dup = `${key}|${day}|${(e.eventName || "").trim().toLowerCase()}`;
    existingDuplicateKeys.add(dup);

    if (!clientProfiles.has(key)) {
      clientProfiles.set(key, {
        clientName: e.clientName,
        clientType: e.clientType,
        clientContact: e.clientContact,
        city: e.city,
        phoneNumber: e.phoneNumber,
      });
    }
  }

  const createdClientKeys = new Set<string>();
  const reusedClientKeys = new Set<string>();

  for (const row of mappedRows) {
    if (existingDuplicateKeys.has(row.duplicateKey)) {
      summary.rowsSkipped += 1;
      logs.push({
        rowNumber: row.rowNumber,
        sheetName: row.sheetName,
        level: "skip",
        message: "Event already exists in database (same client, date, and event)",
      });
      continue;
    }

    const storageKey = phoneStorageKey(row.input.phoneNumber || "");
    const profile = clientProfiles.get(storageKey);

    let input = row.input;
    if (profile) {
      input = applyExistingClientProfile(input, profile);
      reusedClientKeys.add(storageKey);
    } else {
      createdClientKeys.add(storageKey);
      clientProfiles.set(storageKey, {
        clientName: input.clientName,
        clientType: input.clientType || "",
        clientContact: input.clientContact || "",
        city: input.city || "",
        phoneNumber: input.phoneNumber || "",
      });
    }

    await createShootCalendarEntryTx(prisma, input, admin.id);
    summary.eventsCreated += 1;
    existingDuplicateKeys.add(row.duplicateKey);
  }

  summary.clientsCreated = createdClientKeys.size;
  summary.clientsReused = reusedClientKeys.size;

  return summary;
}

export function formatImportSummary(summary: ImportSummary): string {
  const lines = [
    "",
    "Import Complete",
    "",
    `Clients Created: ${summary.clientsCreated}`,
    `Clients Reused: ${summary.clientsReused}`,
    `Events Created: ${summary.eventsCreated}`,
    `Rows Skipped: ${summary.rowsSkipped}`,
    `Errors: ${summary.errors}`,
    `Warnings: ${summary.warnings}`,
  ];

  const problemLogs = summary.logs.filter((l) => l.level === "error" || l.level === "skip");
  if (problemLogs.length > 0) {
    lines.push("", "Details:");
    for (const log of problemLogs.slice(0, 50)) {
      const prefix = log.sheetName ? `${log.sheetName} row ${log.rowNumber}` : `row ${log.rowNumber}`;
      lines.push(`${prefix}: ${log.message}`);
    }
    if (problemLogs.length > 50) {
      lines.push(`... and ${problemLogs.length - 50} more`);
    }
  }

  return lines.join("\n");
}
