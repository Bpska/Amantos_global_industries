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

  // Create Demo Salesperson if none exists
  const existingSales = await prisma.user.findFirst({
    where: { username: 'sp_rajesh' },
  });

  if (!existingSales) {
    console.log('👤 Creating demo field salesperson...');
    const salt = await bcrypt.genSalt(10);
    const salesPasswordHash = await bcrypt.hash('pass123', salt);

    await prisma.user.create({
      data: {
        username: 'sp_rajesh',
        passwordHash: salesPasswordHash,
        fullName: 'Rajesh Kumar (Field Sales)',
        phone: '+919876543210',
        role: Role.SALESPERSON,
        isActive: true,
      },
    });
    console.log('✅ Demo Salesperson created: username=sp_rajesh / password=pass123');
  } else {
    console.log(`ℹ️ Salesperson sp_rajesh already exists.`);
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
