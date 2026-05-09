import "dotenv/config";
import { prisma } from "../src/prisma/client";
import { runInitialSeed } from "../src/services/initialSeed";

async function main() {
  await runInitialSeed({ wipeExisting: true });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
