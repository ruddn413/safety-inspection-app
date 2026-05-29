import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { id: 138, x: 0.10, y: 0.20 },
    { id: 139, x: 0.16, y: 0.20 },
    { id: 140, x: 0.10, y: 0.26 },
    { id: 141, x: 0.16, y: 0.26 }
  ];

  for (const update of updates) {
    await prisma.equipment.update({
      where: { id: update.id },
      data: { locationX: update.x, locationY: update.y }
    });
  }

  console.log("Successfully arranged E-33 to E-36 in a 2x2 grid.");
}

main().finally(() => prisma.$disconnect());
