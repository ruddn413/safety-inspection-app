import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const factories = await prisma.factory.findMany();
  console.log("Factories:", factories);
}

main().finally(() => prisma.$disconnect());
