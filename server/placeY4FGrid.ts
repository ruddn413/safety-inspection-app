import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ids = [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132];
  const planId = 8; // Y동 4층

  const cols = 4;
  const startX = 0.35;
  const startY = 0.35;
  const stepX = 0.10;
  const stepY = 0.10;

  for (let i = 0; i < ids.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    const x = startX + (col * stepX);
    const y = startY + (row * stepY);

    await prisma.equipment.update({
      where: { id: ids[i] },
      data: {
        floorPlanId: planId,
        locationX: x,
        locationY: y
      }
    });
  }

  console.log(`Placed ${ids.length} items on plan ${planId} in a 3x4 (plus 1) grid.`);
}

main().finally(() => prisma.$disconnect());
