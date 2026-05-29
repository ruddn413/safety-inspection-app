import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ids = [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132];
  
  // Center around X=0.5, Y=0.5
  const cols = 4;
  const stepX = 0.04;
  const stepY = 0.04;
  
  // To center 4 columns around 0.5:
  // Col 0: 0.5 - 1.5 * stepX
  // Col 1: 0.5 - 0.5 * stepX
  // Col 2: 0.5 + 0.5 * stepX
  // Col 3: 0.5 + 1.5 * stepX
  const startX = 0.5 - (1.5 * stepX);
  
  // To center 3.25 rows around 0.5:
  // Let's just start at Y=0.45
  const startY = 0.44;

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

  console.log(`Re-placed ${ids.length} items tightly around the '공조실' label.`);
}

main().finally(() => prisma.$disconnect());
