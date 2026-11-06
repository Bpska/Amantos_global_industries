import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const adminUsername = process.env.ADMIN_SEED_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'AdminPassword@123';

  // Clean existing records ONLY if explicitly requested
  if (process.env.RESET_DATABASE === 'true') {
    console.log('🧹 Cleaning existing tables (RESET_DATABASE=true)...');
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create Admin user if none exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!existingAdmin) {
    console.log('👤 Creating initial Admin user...');
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
  } else {
    console.log(`ℹ️ Admin user already exists (@${existingAdmin.username}). Skipping creation.`);
  }

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
