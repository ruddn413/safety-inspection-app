import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ids = [138, 139, 140, 141];
  
  const equipment = await prisma.equipment.findMany({
    where: { id: { in: ids } },
    orderBy: { locationY: 'asc' }
  });

  console.log(equipment.map(e => ({ id: e.id, spec: e.specification, y: e.locationY })));
}

main().finally(() => prisma.$disconnect());
