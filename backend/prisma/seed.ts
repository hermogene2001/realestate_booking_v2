import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kigalire.rw' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@kigalire.rw',
      phone: '+250788000000',
      role: 'ADMIN',
      password: adminPassword,
      language: 'en',
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create sample owner
  const ownerPassword = await bcrypt.hash('owner123', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@kigalire.rw' },
    update: {},
    create: {
      name: 'Jean Claude',
      email: 'owner@kigalire.rw',
      phone: '+250788111111',
      role: 'OWNER',
      password: ownerPassword,
      language: 'rw',
      // Wallet will be linked by user through MetaMask or manual entry
    },
  });
  console.log(`Owner user created: ${owner.email}`);

  // Create sample tenant
  const tenantPassword = await bcrypt.hash('tenant123', 12);
  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@kigalire.rw' },
    update: {},
    create: {
      name: 'Alice Uwimana',
      email: 'tenant@kigalire.rw',
      phone: '+250788222222',
      role: 'TENANT',
      password: tenantPassword,
      language: 'en',
      // Wallet will be linked by user through MetaMask or manual entry
    },
  });
  console.log(`Tenant user created: ${tenant.email}`);

  // Create sample properties
  const properties = [
    {
      ownerId: owner.id,
      title: 'Modern 3-Bedroom Apartment in Kacyiru',
      description: 'Beautiful modern apartment with panoramic views of Kigali. Fully furnished with high-speed internet, 24/7 security, and parking. Walking distance to major offices and restaurants.',
      location: 'KG 7 Ave, Kacyiru',
      district: 'Gasabo',
      lat: -1.9388,
      lng: 29.8656,
      priceEth: '0.5',
      depositEth: '0.2',
      images: '[]',
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      amenities: '["wifi","parking","security","furnished","water_heater"]',
      isApproved: true,
    },
    {
      ownerId: owner.id,
      title: 'Cozy Studio in Nyamirambo',
      description: 'Affordable studio apartment in the vibrant Nyamirambo neighborhood. Perfect for singles or couples. Close to public transport and local markets.',
      location: 'NR 1 Road, Nyamirambo',
      district: 'Nyarugenge',
      lat: -1.9650,
      lng: 29.8500,
      priceEth: '0.15',
      depositEth: '0.05',
      images: '[]',
      bedrooms: 1,
      bathrooms: 1,
      area: 35,
      amenities: '["wifi","water_heater"]',
      isApproved: true,
    },
    {
      ownerId: owner.id,
      title: 'Luxury Villa in Kimihurura',
      description: 'Spacious luxury villa with garden, pool, and stunning views. Located in the upscale Kimihurura neighborhood near embassies and international organizations.',
      location: 'KG 15 Ave, Kimihurura',
      district: 'Gasabo',
      lat: -1.9450,
      lng: 29.8780,
      priceEth: '2.0',
      depositEth: '1.0',
      images: '[]',
      bedrooms: 5,
      bathrooms: 4,
      area: 350,
      amenities: '["wifi","parking","pool","gym","security","garden","furnished","air_conditioning","water_heater","generator","cctv"]',
      isApproved: true,
    },
    {
      ownerId: owner.id,
      title: '2-Bedroom House in Gikondo',
      description: 'Well-maintained 2-bedroom house with a small yard. Quiet neighborhood in Gikondo, close to the industrial area and Kicukiro district center.',
      location: 'KK 30 Street, Gikondo',
      district: 'Kicukiro',
      lat: -1.9600,
      lng: 29.8700,
      priceEth: '0.3',
      depositEth: '0.1',
      images: '[]',
      bedrooms: 2,
      bathrooms: 1,
      area: 85,
      amenities: '["parking","garden","water_heater"]',
      isApproved: true,
    },
    {
      ownerId: owner.id,
      title: 'New Apartment Complex - Remera',
      description: 'Brand new apartment in a modern complex in Remera. Features include a gym, rooftop terrace, and underground parking. Close to Amahoro Stadium.',
      location: 'KG 11 Ave, Remera',
      district: 'Gasabo',
      lat: -1.9530,
      lng: 29.8850,
      priceEth: '0.6',
      depositEth: '0.25',
      images: '[]',
      bedrooms: 2,
      bathrooms: 2,
      area: 95,
      amenities: '["wifi","parking","gym","security","elevator","cctv","laundry"]',
      isApproved: true,
    },
    {
      ownerId: owner.id,
      title: 'Charming House in Kicukiro Center',
      description: 'Traditional Kigali house with modern renovations. Spacious rooms, beautiful garden, and great neighborhood. Perfect for families.',
      location: 'KK 15 Road, Kicukiro',
      district: 'Kicukiro',
      lat: -1.9700,
      lng: 29.8650,
      priceEth: '0.35',
      depositEth: '0.15',
      images: '[]',
      bedrooms: 3,
      bathrooms: 2,
      area: 130,
      amenities: '["parking","garden","security","water_heater","generator"]',
      isApproved: false, // Not yet approved - for admin testing
    },
  ];

  for (const prop of properties) {
    await prisma.property.create({ data: prop });
  }
  console.log(`${properties.length} properties created`);

  console.log('Seed complete!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@kigalire.rw / admin123');
  console.log('Owner: owner@kigalire.rw / owner123');
  console.log('Tenant: tenant@kigalire.rw / tenant123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
