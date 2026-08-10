import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Default shared password for easy assignment testing
  const defaultPassword = await bcrypt.hash('admin123', 10);

  // 1. Seed System Users for all 4 required roles
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fundsroom.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@fundsroom.com',
      password: defaultPassword,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@fundsroom.com' },
    update: {},
    create: {
      name: 'Rahul Sharma (Sales Lead)',
      email: 'sales@fundsroom.com',
      password: defaultPassword,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@fundsroom.com' },
    update: {},
    create: {
      name: 'Vikram Singh (Warehouse Manager)',
      email: 'warehouse@fundsroom.com',
      password: defaultPassword,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.upsert({
    where: { email: 'accounts@fundsroom.com' },
    update: {},
    create: {
      name: 'Priya Mehta (Accounts Executive)',
      email: 'accounts@fundsroom.com',
      password: defaultPassword,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Seeded 4 default users for ADMIN, SALES, WAREHOUSE, and ACCOUNTS roles.');

  // 2. Seed Initial CRM Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Amit Patel',
      mobile: '+91 9876543210',
      email: 'amit@apexdistributors.com',
      businessName: 'Apex Distributors Pvt Ltd',
      gstNumber: '27AAACA12341Z5',
      customerType: 'DISTRIBUTOR',
      address: 'Plot 42, MIDC Industrial Area, Mumbai',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Interested in bulk orders of industrial safety gear.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Suresh Kumar',
      mobile: '+91 9123456789',
      email: 'suresh@metroretailers.in',
      businessName: 'Metro Hardware Store',
      gstNumber: '27BBBCB56782Z9',
      customerType: 'RETAIL',
      address: 'Shop 12, Main Market, Pune',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Requested product catalog and wholesale pricing list.',
    },
  });

  // Seed sample follow-up note
  await prisma.customerNote.create({
    data: {
      customerId: customer1.id,
      note: 'Called client regarding quarterly discount structure. Sent revised quotation.',
      createdBy: salesUser.id,
    },
  });

  console.log('✅ Seeded sample CRM customers and follow-up notes.');

  // 3. Seed Sample Products & Initial Stock
  await prisma.product.createMany({
    data: [
      {
        name: 'Industrial Heavy Duty Drill Machine 850W',
        sku: 'PWR-DRL-001',
        category: 'Power Tools',
        unitPrice: 3499.0,
        currentStock: 45,
        minStockAlert: 10,
        location: 'Bay A - Shelf 3',
      },
      {
        name: 'Safety Steel-Toe Work Boots (Size 9)',
        sku: 'SAF-BOT-009',
        category: 'Safety Equipment',
        unitPrice: 1850.0,
        currentStock: 4, // Intentionally low stock to test alerts!
        minStockAlert: 8,
        location: 'Bay C - Rack 12',
      },
      {
        name: 'High Visibility Reflective Vest (Pack of 10)',
        sku: 'SAF-VST-010',
        category: 'Safety Equipment',
        unitPrice: 799.0,
        currentStock: 120,
        minStockAlert: 20,
        location: 'Bay B - Shelf 1',
      },
    ],
  });

  console.log('✅ Seeded sample inventory products with low-stock test cases.');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
