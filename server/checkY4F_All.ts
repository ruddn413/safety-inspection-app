import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.floorPlan.findFirst({
    where: { name: { contains: 'Y동 4층' } }
  });

  if (!plan) return;

  const eq = await prisma.equipment.findMany({
    where: { floorPlanId: plan.id }
  });

  console.log("All eq on Y 4F:", eq.map(e => ({
    id: e.id, spec: e.specification, x: e.locationX, y: e.locationY
  })));
}

main().finally(() => prisma.$disconnect());
