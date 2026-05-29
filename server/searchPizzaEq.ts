import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const eq = await prisma.equipment.findMany({
    where: { 
      OR: [
        { name: { contains: '피자' } },
        { categoryMain: { contains: '피자' } },
        { categorySub: { contains: '피자' } },
        { specification: { contains: '피자' } },
        { recentPassNum: { contains: '피자' } }
      ]
    }
  });
  console.log(eq);
}

main().finally(() => prisma.$disconnect());
