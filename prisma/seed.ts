import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const adminUsername = process.env.ADMIN_SEED_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'AdminPassword@123';

  // 1. Clean existing records in reverse dependency order
  console.log('🧹 Cleaning existing tables...');
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin user
  console.log('👤 Creating Admin user...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, salt);

  const admin = await prisma.user.create({
    data: {
      username: adminUsername,
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      phone: '+919999999999',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin created: username=${admin.username}`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
