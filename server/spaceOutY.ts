import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { id: 138, y: 0.20 },
    { id: 139, y: 0.25 },
    { id: 140, y: 0.30 },
    { id: 141, y: 0.35 }
  ];

  for (const update of updates) {
    await prisma.equipment.update({
      where: { id: update.id },
      data: { locationY: update.y }
    });
  }

  console.log("Successfully spaced out E-33 to E-36 vertically.");
}

main().finally(() => prisma.$disconnect());
