import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "node:path";
import * as path from "node:path";
import * as fs from "node:fs";
import * as XLSX from "xlsx";
import { CareerApplicationSource } from "@prisma/client";
import { prisma } from "../src/prisma/client";
import { createCareerApplication, mapHiringSheetStatus } from "../src/services/careerService";
import { isValidPhone, normalizePhone } from "../src/utils/phone";

config({ path: resolve(__dirname, "../.env"), override: true });

type Raw = Record<string, unknown>;

function cell(row: Raw, ...keys: string[]) {
  for (const key of keys) {
    if (key in row && row[key] != null) return String(row[key]).trim();
  }
  for (const [k, v] of Object.entries(row)) {
    const nk = k.trim().toLowerCase();
    if (keys.some((want) => want.trim().toLowerCase() === nk)) return String(v ?? "").trim();
  }
  return "";
}

function parseTimestamp(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  return new Date(Date.UTC(year, Number(m[1]) - 1, Number(m[2]), Number(m[4] ?? 12), Number(m[5] ?? 0), Number(m[6] ?? 0)));
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/importHiringFromAppSheet.ts <file.xlsx>");
    process.exit(1);
  }
  const filePath = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => n.trim().toUpperCase() === "HIRING");
  if (!sheetName) {
    console.error(`No Hiring sheet. Sheets: ${wb.SheetNames.join(", ")}`);
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json<Raw>(wb.Sheets[sheetName]!, { defval: "", raw: false });
  console.log(`Importing ${rows.length} hiring rows from "${sheetName}"`);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const name = cell(row, "NAME", "Name");
    const email = cell(row, "Email Address", "Email");
    const phone = cell(row, "CONTACT NUMBER", "Phone");
    const role = cell(row, "ROLE", "Role");
    const softwares = cell(row, "softwares  am good at ", "softwares am good at");
    const experience = cell(row, "EXPERIENCE", "Experience");
    const portfolio = cell(row, "PORTFOLIO ", "PORTFOLIO", "Portfolio");
    const instagram = cell(row, "INSTAGRAM LINK", "Instagram");
    const statusRaw = cell(row, "STATUS", "Status");
    const notes = cell(row, "NOTES", "Notes");
    const ts = cell(row, "Timestamp");

    if (!phone || !isValidPhone(phone) || !role) {
      errors.push(`row ${i + 2}: missing phone/role (${name || "unnamed"})`);
      continue;
    }

    const phoneNormalized = normalizePhone(phone);
    const submittedAt = parseTimestamp(ts) ?? new Date();
    const externalId = `appsheet-hiring:${phoneNormalized}:${role.toUpperCase()}:${submittedAt.toISOString()}`;

    const existing = await prisma.careerApplication.findUnique({ where: { externalId } });
    if (existing) {
      skipped += 1;
      continue;
    }

    try {
      await createCareerApplication({
        name,
        email,
        phoneNumber: phone,
        roleApplied: role,
        softwares,
        experience,
        portfolioUrl: portfolio,
        instagramLink: instagram,
        notes,
        status: mapHiringSheetStatus(statusRaw),
        source: CareerApplicationSource.IMPORT,
        externalId,
        submittedAt,
      });
      created += 1;
      console.log(`+ ${name || phone} · ${role} · ${mapHiringSheetStatus(statusRaw)}`);
    } catch (e) {
      errors.push(`row ${i + 2}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log("\n=== Hiring import summary ===");
  console.log(`created: ${created}`);
  console.log(`skipped: ${skipped}`);
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
