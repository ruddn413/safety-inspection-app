import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const eq = await prisma.equipment.findMany({
    where: { 
      OR: [
        { categoryDetail: { contains: '콤프' } },
        { categoryDetail: { contains: '컴프' } },
        { categoryDetail: { contains: '준1층' } }
      ],
      locationX: { not: null }
    }
  });

  console.log(eq.map(e => ({
    id: e.id,
    name: e.name,
    spec: e.specification,
    detail: e.categoryDetail,
    x: e.locationX,
    y: e.locationY
  })));
}

main().finally(() => prisma.$disconnect());
