import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.equipment.update({
    where: { id: 97 },
    data: { categoryMain: '치즈' }
  });

  console.log(`Updated categoryMain to '치즈' for ID 97 (N-23).`);
}

main().finally(() => prisma.$disconnect());
