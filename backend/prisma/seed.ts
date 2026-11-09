import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const adminUsername = process.env.ADMIN_SEED_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'admin@123';

  // Clean existing records ONLY if explicitly requested
  if (process.env.RESET_DATABASE === 'true') {
    console.log('🧹 Cleaning existing tables (RESET_DATABASE=true)...');
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create Admin user if none exists, or update password if it exists
  const existingAdmin = await prisma.user.findFirst({
    where: { username: adminUsername },
  });

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, salt);

  if (!existingAdmin) {
    console.log('👤 Creating initial Admin user...');
    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash: adminPasswordHash,
        fullName: 'System Administrator',
        phone: '+91 99999 00000',
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Admin created: username=${admin.username} / password=${adminPassword}`);
  } else {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { passwordHash: adminPasswordHash },
    });
    console.log(`✅ Admin user password updated: username=${existingAdmin.username}`);
  }

  // Initialize Default Billing Settings
  const existingBilling = await prisma.billingSetting.findUnique({
    where: { id: 'default' },
  });

  if (!existingBilling) {
    await prisma.billingSetting.create({
      data: {
        id: 'default',
        businessName: 'Amantos Global Industries',
        tagline: 'Industrial & Commercial Distribution Network',
        phone: '+91 98765 43210',
        address: 'Main Commercial Hub, Bhubaneswar, Odisha',
        terms: 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.',
        logoUrl: '/assets/brand/amantos-logo.jpg',
      },
    });
    console.log('✅ Billing settings initialized.');
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
