import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ids = [138, 139, 140, 141];
  
  const eq = await prisma.equipment.findMany({
    where: { id: { in: ids } },
    include: { floorPlan: true }
  });

  console.log(eq.map(e => ({
    id: e.id,
    spec: e.specification,
    plan: e.floorPlan?.name,
    x: e.locationX,
    y: e.locationY
  })));
}

main().finally(() => prisma.$disconnect());
