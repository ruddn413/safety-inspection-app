import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const eq = await prisma.equipment.findMany({
    where: { categoryMain: '피자' }
  });
  console.log(eq.map(e => ({ id: e.id, name: e.name, categoryMain: e.categoryMain })));
}

main().finally(() => prisma.$disconnect());
