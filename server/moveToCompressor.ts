import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { id: 138, x: 0.125, y: 0.235 }, // Top-Left
    { id: 139, x: 0.141, y: 0.235 }, // Top-Right
    { id: 140, x: 0.125, y: 0.261 }, // Bottom-Left
    { id: 141, x: 0.141, y: 0.261 }  // Bottom-Right
  ];

  for (const update of updates) {
    await prisma.equipment.update({
      where: { id: update.id },
      data: { locationX: update.x, locationY: update.y }
    });
  }

  console.log("Successfully moved E-33 to E-36 into the compressor room (X~0.133, Y~0.248).");
}

main().finally(() => prisma.$disconnect());
