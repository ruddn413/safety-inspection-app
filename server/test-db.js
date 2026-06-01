require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9xVmJEq2ZwLS@ep-hidden-recipe-aq8cxsmh-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

async function main() {
  try {
    const factories = await prisma.factory.findMany();
    const floorPlans = await prisma.floorPlan.findMany();
    const equipments = await prisma.equipment.findMany();
    
    console.log(`Factories: ${factories.length}`);
    console.log(`FloorPlans: ${floorPlans.length}`);
    console.log(`Equipments: ${equipments.length}`);
    
    if (factories.length > 0) {
      console.log('Sample Factory:', factories[0]);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
