import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const eq = await prisma.equipment.findMany({
    where: { 
      OR: [
        { name: { contains: 'N-23' } },
        { specification: { contains: 'N-23' } },
        { categoryDetail: { contains: 'N-23' } }
      ]
    }
  });

  console.log("Found N-23:", eq.map(e => ({
    id: e.id, 
    name: e.name, 
    spec: e.specification,
    main: e.categoryMain,
    sub: e.categorySub,
    detail: e.categoryDetail,
    planId: e.floorPlanId
  })));
}

main().finally(() => prisma.$disconnect());
