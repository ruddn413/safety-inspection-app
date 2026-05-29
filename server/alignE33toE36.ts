import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ids = [138, 139, 140, 141];
  
  const equipment = await prisma.equipment.findMany({
    where: { id: { in: ids } }
  });

  if (equipment.length === 0) {
    console.log("Could not find the specified equipment.");
    return;
  }

  // Calculate averages
  let sumX = 0;
  let sumY = 0;
  let minX = 999, maxX = -999;
  let minY = 999, maxY = -999;
  
  for (const eq of equipment) {
    if (eq.locationX !== null && eq.locationY !== null) {
      sumX += eq.locationX;
      sumY += eq.locationY;
      if (eq.locationX < minX) minX = eq.locationX;
      if (eq.locationX > maxX) maxX = eq.locationX;
      if (eq.locationY < minY) minY = eq.locationY;
      if (eq.locationY > maxY) maxY = eq.locationY;
    }
  }

  const avgX = sumX / equipment.length;
  const avgY = sumY / equipment.length;
  
  const spreadX = maxX - minX;
  const spreadY = maxY - minY;

  // If spreadX is smaller than spreadY, they are arranged vertically, so align their X.
  // If spreadY is smaller than spreadX, they are arranged horizontally, so align their Y.
  const alignVertical = spreadX < spreadY;

  for (const eq of equipment) {
    if (eq.locationX !== null && eq.locationY !== null) {
      if (alignVertical) {
        await prisma.equipment.update({
          where: { id: eq.id },
          data: { locationX: avgX }
        });
      } else {
        await prisma.equipment.update({
          where: { id: eq.id },
          data: { locationY: avgY }
        });
      }
    }
  }

  console.log(`Aligned 4 items (E-33 to E-36) ${alignVertical ? 'vertically (X=' + avgX + ')' : 'horizontally (Y=' + avgY + ')'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
