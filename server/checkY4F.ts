import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.floorPlan.findFirst({
    where: { name: { contains: 'Y동 4층' } }
  });

  if (!plan) {
    console.log("Could not find Y동 4층 plan");
    return;
  }
  
  // Find equipment mapped to Y동 4층 process
  const mappings = plan.processName?.split(',').map(m => m.trim()).filter(m => m) || [];
  
  const unplacedEq = await prisma.equipment.findMany({
    where: { 
      locationX: null, 
      floorPlanId: null 
    }
  });

  const filtered = unplacedEq.filter(eq => 
    mappings.some(mapping => 
      eq.categoryMain?.includes(mapping) || 
      eq.name?.includes(mapping) ||
      eq.specification?.includes(mapping)
    )
  );

  console.log(`Plan ID: ${plan.id}, Process: ${plan.processName}`);
  console.log(`Found ${filtered.length} unplaced equipment for Y동 4층.`);
  console.log(filtered.map(e => e.id).join(', '));
}

main().finally(() => prisma.$disconnect());
