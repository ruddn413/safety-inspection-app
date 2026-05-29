import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.equipment.updateMany({
    where: { categoryMain: '"피자' },
    data: { categoryMain: '피자' }
  });
  console.log(`Updated ${result.count} items with typo '"피자' to '피자'.`);
}

main().finally(() => prisma.$disconnect());
