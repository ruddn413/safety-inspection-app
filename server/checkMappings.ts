import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.floorPlan.findMany();
  console.log(plans.map(p => ({ id: p.id, name: p.name, processName: p.processName })));
}

main().finally(() => prisma.$disconnect());
