import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ids = [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132];
  
  // Center around X=0.22, Y=0.38 (The red circle)
  const cols = 4;
  const startX = 0.18;
  const startY = 0.30;
  const stepX = 0.03;
  const stepY = 0.04;

  for (let i = 0; i < ids.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    const x = startX + (col * stepX);
    const y = startY + (row * stepY);

    await prisma.equipment.update({
      where: { id: ids[i] },
      data: {
        locationX: x,
        locationY: y
      }
    });
  }

  console.log(`Moved 13 items to the red circle area (X: 0.18-0.27, Y: 0.30-0.42).`);
}

main().finally(() => prisma.$disconnect());
