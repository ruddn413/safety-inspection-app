import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.floorPlan.findFirst({
    where: { name: { contains: 'Y동 2층' } }
  });

  if (!plan) return;

  const eq = await prisma.equipment.findMany({
    where: { floorPlanId: plan.id, locationX: { not: null } }
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
