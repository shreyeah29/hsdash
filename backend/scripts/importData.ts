import "dotenv/config";
import * as path from "path";
import { prisma } from "../src/prisma/client";
import { formatImportSummary, runShootDataImport } from "../src/services/importService";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    // eslint-disable-next-line no-console
    console.error("Usage: npm run import-data -- <file.xlsx|file.xls|file.csv>");
    // eslint-disable-next-line no-console
    console.error("Example: npm run import-data -- backend/imports/2025-data.xlsx");
    process.exit(1);
  }

  const filePath = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
  // eslint-disable-next-line no-console
  console.log(`Importing: ${filePath}`);

  const summary = await runShootDataImport(filePath);
  // eslint-disable-next-line no-console
  console.log(formatImportSummary(summary));

  if (summary.eventsCreated === 0 && summary.errors > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
