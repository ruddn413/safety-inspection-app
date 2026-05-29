import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.floorPlan.findFirst({
    where: { name: { contains: 'Y동 1층' } }
  });

  if (!plan) {
    console.log("Could not find Y동 1층 plan");
    return;
  }

  // Update processName to include '슈레드' and the specific pizza equipment
  await prisma.floorPlan.update({
    where: { id: plan.id },
    data: { processName: '슈레드, 피자-2호-1공정(N-14)' }
  });

  console.log(`Updated floor plan '${plan.name}' processName to '슈레드, 피자-2호-1공정(N-14)'`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
