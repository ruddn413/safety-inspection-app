import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.floorPlan.findMany({
    where: {
      name: {
        contains: 'S동 2층'
      }
    },
    orderBy: { id: 'asc' }
  });
  
  if (plans.length > 1) {
    const oldPlan = plans[0];
    
    // First, clear floorPlanId from equipment that might be using this plan
    await prisma.equipment.updateMany({
      where: { floorPlanId: oldPlan.id },
      data: { floorPlanId: null, locationX: null, locationY: null }
    });

    // Delete the old plan
    await prisma.floorPlan.delete({ where: { id: oldPlan.id } });
    console.log(`Deleted old plan ID: ${oldPlan.id} named: ${oldPlan.name}`);
  } else {
    console.log(`Only found ${plans.length} plan(s).`);
    console.log(plans);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
