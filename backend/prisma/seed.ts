/**
 * Database Seed — DEVELOPMENT ONLY
 * Creates demo accounts and sample data.
 * Uses environment variables for admin credentials.
 * Never run against production without reviewing carefully.
 */
import { PrismaClient, Role, AccountStatus, VehicleStatus, TransmissionType, FuelType } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

async function hash(password: string) {
  return argon2.hash(password, ARGON2_OPTIONS);
}

async function main() {
  console.log('🌱 Seeding database...');

  // ── Vehicle Categories ──────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.vehicleCategory.upsert({
      where: { name: 'Economy' },
      update: {},
      create: { name: 'Economy', description: 'Affordable compact vehicles' },
    }),
    prisma.vehicleCategory.upsert({
      where: { name: 'SUV' },
      update: {},
      create: { name: 'SUV', description: 'Sport Utility Vehicles' },
    }),
    prisma.vehicleCategory.upsert({
      where: { name: 'Luxury' },
      update: {},
      create: { name: 'Luxury', description: 'Premium luxury vehicles' },
    }),
    prisma.vehicleCategory.upsert({
      where: { name: 'Van' },
      update: {},
      create: { name: 'Van', description: 'Passenger and cargo vans' },
    }),
    prisma.vehicleCategory.upsert({
      where: { name: 'Truck' },
      update: {},
      create: { name: 'Truck', description: 'Pickup trucks' },
    }),
  ]);

  const [economy, suv, luxury] = categories;

  // ── Administrator Account ─────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@fleetflow.dev';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@FleetFlow2025!';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hash(adminPassword),
      role: Role.ADMINISTRATOR,
      status: AccountStatus.ACTIVE,
      firstName: 'System',
      lastName: 'Administrator',
    },
  });
  console.log(`✅ Admin: ${adminEmail}`);

  // ── Fleet Manager ─────────────────────────────────────────────────────────
  const manager = await prisma.user.upsert({
    where: { email: 'manager@fleetflow.dev' },
    update: {},
    create: {
      email: 'manager@fleetflow.dev',
      passwordHash: await hash('Manager@FleetFlow2025!'),
      role: Role.FLEET_MANAGER,
      status: AccountStatus.ACTIVE,
      firstName: 'Fleet',
      lastName: 'Manager',
    },
  });
  console.log(`✅ Fleet Manager: manager@fleetflow.dev`);

  // ── Rental Agent ──────────────────────────────────────────────────────────
  const agent = await prisma.user.upsert({
    where: { email: 'agent@fleetflow.dev' },
    update: {},
    create: {
      email: 'agent@fleetflow.dev',
      passwordHash: await hash('Agent@FleetFlow2025!'),
      role: Role.RENTAL_AGENT,
      status: AccountStatus.ACTIVE,
      firstName: 'Rental',
      lastName: 'Agent',
    },
  });
  console.log(`✅ Rental Agent: agent@fleetflow.dev`);

  // ── Demo Customer ─────────────────────────────────────────────────────────
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@fleetflow.dev' },
    update: {},
    create: {
      email: 'customer@fleetflow.dev',
      passwordHash: await hash('Customer@FleetFlow2025!'),
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      firstName: 'Jane',
      lastName: 'Demo',
      phone: '+1-555-0100',
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      drivingLicenceNumber: 'DL-DEMO-2025',
      licenceExpiryDate: new Date('2028-12-31'),
      licenceCountry: 'US',
      isVerified: true,
      verifiedAt: new Date(),
      address: '123 Demo Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postalCode: '94102',
    },
  });
  console.log(`✅ Customer: customer@fleetflow.dev`);

  // ── Sample Vehicles ───────────────────────────────────────────────────────
  const vehiclesData = [
    {
      registrationNumber: 'FF-ECO-001',
      make: 'Toyota',
      model: 'Corolla',
      year: 2023,
      categoryId: economy.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seatingCapacity: 5,
      dailyRate: 45.00,
      mileage: 12000,
      color: 'Silver',
      description: 'Reliable and fuel-efficient economy sedan. Perfect for city driving and daily commutes.',
      status: VehicleStatus.AVAILABLE,
      insuranceExpiryDate: new Date('2025-12-31'),
      registrationExpiryDate: new Date('2025-06-30'),
      imageUrl: '/images/car-sedan.jpg',
    },
    {
      registrationNumber: 'FF-SUV-001',
      make: 'Ford',
      model: 'Explorer',
      year: 2022,
      categoryId: suv.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seatingCapacity: 7,
      dailyRate: 85.00,
      mileage: 28000,
      color: 'Black',
      description: 'Spacious SUV perfect for families and road trips. Powerful and comfortable.',
      status: VehicleStatus.AVAILABLE,
      insuranceExpiryDate: new Date('2025-11-30'),
      registrationExpiryDate: new Date('2025-08-31'),
      imageUrl: '/images/car-suv.jpg',
    },
    {
      registrationNumber: 'FF-LUX-001',
      make: 'BMW',
      model: '5 Series',
      year: 2024,
      categoryId: luxury.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      seatingCapacity: 5,
      dailyRate: 150.00,
      mileage: 5000,
      color: 'Midnight Blue',
      description: 'Premium luxury sedan with advanced technology, exceptional comfort and refined performance.',
      status: VehicleStatus.AVAILABLE,
      insuranceExpiryDate: new Date('2026-03-31'),
      registrationExpiryDate: new Date('2026-01-31'),
      imageUrl: '/images/car-luxury.jpg',
    },
    {
      registrationNumber: 'FF-ECO-002',
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      categoryId: economy.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.PETROL,
      seatingCapacity: 5,
      dailyRate: 42.00,
      mileage: 9500,
      color: 'White',
      description: 'Compact and efficient city car. Great fuel economy and easy to park.',
      status: VehicleStatus.AVAILABLE,
      insuranceExpiryDate: new Date('2025-10-31'),
      registrationExpiryDate: new Date('2025-09-30'),
      imageUrl: '/images/car-economy.jpg',
    },
    {
      registrationNumber: 'FF-SUV-002',
      make: 'Toyota',
      model: 'RAV4',
      year: 2023,
      categoryId: suv.id,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      seatingCapacity: 5,
      dailyRate: 75.00,
      mileage: 15000,
      color: 'Pearl White',
      description: 'Fuel-efficient hybrid SUV with spacious interior and all-terrain capability.',
      status: VehicleStatus.AVAILABLE,
      insuranceExpiryDate: new Date('2025-12-31'),
      registrationExpiryDate: new Date('2026-01-31'),
      imageUrl: '/images/car-sport.jpg',
    },
  ];

  const vehicles = vehiclesData;

  for (const v of vehicles) {
    const { imageUrl, ...vehicleData } = v;
    const vehicle = await prisma.vehicle.upsert({
      where: { registrationNumber: vehicleData.registrationNumber },
      update: {},
      create: vehicleData,
    });
    // Add primary image if not already present
    const existingImg = await prisma.vehicleImage.findFirst({ where: { vehicleId: vehicle.id } });
    if (!existingImg) {
      await prisma.vehicleImage.create({
        data: { vehicleId: vehicle.id, url: imageUrl, altText: `${vehicleData.make} ${vehicleData.model}`, isPrimary: true },
      });
    }
  }
  console.log(`✅ ${vehicles.length} vehicles seeded`);

  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DEMO ACCOUNTS (development only):');
  console.log(`  Admin:         ${adminEmail} / ${adminPassword}`);
  console.log('  Fleet Manager: manager@fleetflow.dev / Manager@FleetFlow2025!');
  console.log('  Rental Agent:  agent@fleetflow.dev / Agent@FleetFlow2025!');
  console.log('  Customer:      customer@fleetflow.dev / Customer@FleetFlow2025!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  CHANGE ALL PASSWORDS BEFORE DEPLOYING TO PRODUCTION');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
