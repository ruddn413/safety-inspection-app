const sqlite3 = require('sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { put } = require('@vercel/blob');
require('dotenv').config({ path: '.env.local' });

// Add the Vercel DB URL to the environment
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9xVmJEq2ZwLS@ep-hidden-recipe-aq8cxsmh-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require';
process.env.POSTGRES_URL_NON_POOLING = 'postgresql://neondb_owner:npg_9xVmJEq2ZwLS@ep-hidden-recipe-aq8cxsmh.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';
process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_zni9Ztl2lrJ21sH1_PnqwIzwCrrSTBm0D4iwcEdMXX7Ud3s';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

async function migrate() {
  console.log('Starting migration from dev.db to Postgres...');
  try {
    const devDbPath = path.join(__dirname, 'prisma', 'dev.db');
    if (!fs.existsSync(devDbPath)) {
      console.log('dev.db not found at ' + devDbPath);
      return;
    }
    
    const sqlite = new sqlite3.Database(devDbPath);
    
    // Read from SQLite
    const factories = await new Promise((res, rej) => sqlite.all('SELECT * FROM "Factory"', (e, rows) => e ? rej(e) : res(rows)));
    const floorPlans = await new Promise((res, rej) => sqlite.all('SELECT * FROM "FloorPlan"', (e, rows) => e ? rej(e) : res(rows)));
    const equipments = await new Promise((res, rej) => sqlite.all('SELECT * FROM "Equipment"', (e, rows) => e ? rej(e) : res(rows)));
    
    console.log(`Found ${factories.length} factories, ${floorPlans.length} floor plans, ${equipments.length} equipments.`);

    // Write to Postgres
    for (const f of factories) {
      await prisma.factory.upsert({
        where: { id: f.id },
        update: { name: f.name, location: f.address || null },
        create: { id: f.id, name: f.name, location: f.address || null }
      });
    }
    
    for (const fp of floorPlans) {
      await prisma.floorPlan.upsert({
        where: { id: fp.id },
        update: { name: fp.name, imageUrl: fp.imageUrl || null },
        create: { id: fp.id, name: fp.name, imageUrl: fp.imageUrl || null, factoryId: fp.factoryId }
      });
    }
    
    for (const e of equipments) {
      const fp = floorPlans.find(p => p.id === e.floorPlanId);
      const factoryId = fp ? fp.factoryId : factories[0]?.id || 1;
      
      await prisma.equipment.upsert({
        where: { id: e.id },
        update: {
          name: e.processName || e.type || "알 수 없음",
          categoryMain: e.type, 
          status: e.status || "ACTIVE", 
          locationX: e.x, 
          locationY: e.y, 
          qrImageUrl: e.qrImageUrl || null,
          attachmentUrl: e.attachmentUrl || null
        },
        create: { 
          id: e.id, 
          factoryId: factoryId,
          name: e.processName || e.type || "알 수 없음",
          categoryMain: e.type, 
          status: e.status || "ACTIVE", 
          locationX: e.x, 
          locationY: e.y, 
          floorPlanId: e.floorPlanId,
          qrImageUrl: e.qrImageUrl || null,
          attachmentUrl: e.attachmentUrl || null
        }
      });
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
