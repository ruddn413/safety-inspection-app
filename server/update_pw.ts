import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9xVmJEq2ZwLS@ep-hidden-recipe-aq8cxsmh-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('1234', 10);
  await prisma.user.update({
    where: { username: 'admin' },
    data: { passwordHash }
  });
  console.log('Password for admin successfully updated to 1234');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
