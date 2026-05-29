import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const eq = await prisma.equipment.findMany({
    where: { 
      OR: [
        { name: { contains: 'N-14' } },
        { categoryMain: { contains: 'N-14' } },
        { categorySub: { contains: 'N-14' } },
        { categoryDetail: { contains: 'N-14' } },
        { specification: { contains: 'N-14' } },
        { recentPassNum: { contains: 'N-14' } },
        { manufacturingNum: { contains: 'N-14' } }
      ]
    }
  });
  console.log(eq);
}

main().finally(() => prisma.$disconnect());
