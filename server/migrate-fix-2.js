const sqlite3 = require('sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9xVmJEq2ZwLS@ep-hidden-recipe-aq8cxsmh-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require';
process.env.POSTGRES_URL_NON_POOLING = 'postgresql://neondb_owner:npg_9xVmJEq2ZwLS@ep-hidden-recipe-aq8cxsmh.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient();

async function migrateFix2() {
  console.log('Starting data fix migration 2 (locations)...');
  try {
    const devDbPath = path.join(__dirname, 'prisma', 'dev.db');
    const sqlite = new sqlite3.Database(devDbPath);
    
    const equipments = await new Promise((res, rej) => sqlite.all('SELECT * FROM "Equipment"', (e, rows) => e ? rej(e) : res(rows)));
    
    console.log(`Found ${equipments.length} equipments in local dev.db.`);

    for (const e of equipments) {
      await prisma.equipment.update({
        where: { id: e.id },
        data: {
          locationX: e.locationX || null,
          locationY: e.locationY || null,
        }
      });
    }
    
    console.log('Fix 2 completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateFix2();
