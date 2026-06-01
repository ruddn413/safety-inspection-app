import { config } from 'dotenv';
import { PrismaClient } from './server/node_modules/@prisma/client/index.js';
import bcrypt from 'bcryptjs';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function seed() {
  try {
    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin1234', 10);
      await prisma.user.create({
        data: { username: 'admin', passwordHash, role: 'admin' }
      });
      console.log('Admin user successfully created!');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
