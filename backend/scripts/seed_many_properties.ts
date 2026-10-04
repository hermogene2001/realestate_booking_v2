import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const images = [
  '/uploads/property-1777295367604-733778790.webp',
  '/uploads/property-1778447755841-208987795.jpg',
  '/uploads/property-1778447755888-322603804.jpg',
  '/uploads/property-1778447755896-333149814.jpg',
  '/uploads/property-1778447755923-899396644.jpg',
  '/uploads/property-1778447943245-288666398.jpg',
  '/uploads/property-1778447943251-29526463.jpg',
  '/uploads/property-1778447943262-537577841.jpg',
  '/uploads/property-1778447943265-152788122.jpg',
  '/uploads/property-1779791786973-599487129.jpg',
];

const amenitiesList = [
  'wifi', 'parking', 'pool', 'gym', 'security', 'garden',
  'balcony', 'furnished', 'air_conditioning', 'water_heater',
  'generator', 'cctv', 'laundry', 'elevator'
];

function pick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function rand(min: number, max: number, decimals = 4): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randCoord(base: number, range = 0.02): number {
  return parseFloat((base + (Math.random() - 0.5) * range).toFixed(6));
}

const districts = [
  { name: 'Gasabo', lat: -1.94, lng: 29.87, locations: ['KG 7 Ave, Kacyiru', 'KG 15 Ave, Kimihurura', 'KG 11 Ave, Remera', 'KG 218 St, Kisimenti', 'KG 5 Ave, Nyarutarama', 'KG 9 Ave, Gishushu'] },
  { name: 'Kicukiro', lat: -1.96, lng: 29.86, locations: ['KK 15 Road, Kicukiro Center', 'KK 30 Street, Gikondo', 'KK 5 Ave, Kanombe', 'KK 20 Rd, Niboye', 'KK 12 Ave, Gatenga'] },
  { name: 'Nyarugenge', lat: -1.97, lng: 29.84, locations: ['NR 1 Road, Nyamirambo', 'NR 5 Ave, Muhima', 'NR 10 St, Kimisagara', 'NR 7 Road, Rwesero', 'NR 3 Ave, Nyakabanda'] },
];

const titlesByDistrict: Record<string, string[]> = {
  Gasabo: [
    'Modern 1-Bedroom Apartment in Nyarutarama',
    'Spacious 3-Bedroom Villa in Kacyiru',
    'Elegant Studio in Kimihurura',
    'Premium 2-Bedroom Apartment in Remera',
    'Executive Suite in Gishushu Business District',
    'Beautiful 4-Bedroom Home in Kisimenti',
    'Cozy 1-Bedroom Flat in Kacyiru',
    'Luxury Penthouse in Kimihurura',
    'Family House in Nyarutarama',
    'Contemporary 2-Bedroom in Remera',
    'Deluxe Studio in Gishushu',
    'Charming 3-Bedroom Bungalow in Kacyiru',
    'High-End Apartment in Kimihurura',
    'Stylish Loft in Nyarutarama',
    'Garden Villa in Kisimenti',
  ],
  Kicukiro: [
    'Affordable 2-Bedroom in Gikondo',
    'Modern House in Kicukiro Center',
    'Compact Studio in Kanombe',
    'Family Home in Niboye',
    'Renovated 3-Bedroom in Gatenga',
    'New 1-Bedroom Apartment in Gikondo',
    'Cozy 2-Bedroom Bungalow in Kicukiro',
    'Spacious Flat in Kanombe',
    'Corner House in Niboye',
    'Townhouse in Kicukiro Center',
  ],
  Nyarugenge: [
    'Budget Studio in Nyamirambo',
    'Traditional House in Muhima',
    '2-Bedroom Apartment in Kimisagara',
    'Renovated Home in Rwesero',
    'Affordable Room in Nyakabanda',
    'Compact 1-Bedroom in Nyamirambo',
    'Family House in Muhima',
    'Studio Flat in Kimisagara',
  ],
};

const descriptions = [
  'Well-maintained property in a quiet neighborhood with easy access to public transport, shops, and schools.',
  'Beautiful property featuring modern finishes, ample natural light, and a spacious layout perfect for families or professionals.',
  'Recently renovated with high-quality materials. Enjoy a blend of modern comfort and traditional charm in a prime location.',
  'Located in a sought-after area, this property offers convenience, security, and all essential amenities nearby.',
  'A fantastic opportunity to rent in a growing neighborhood. The property features generous room sizes and great outdoor space.',
  'Stylish and functional living space with excellent views. Close to restaurants, supermarkets, and entertainment venues.',
  'Peaceful retreat in the heart of the city. The property combines urban convenience with a serene environment.',
  'Quality construction with attention to detail. Features include modern kitchen, spacious bedrooms, and beautiful finishes.',
];

const allPropertyData: {
  ownerId: number;
  title: string;
  description: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
  priceEth: string;
  depositEth: string;
  images: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string;
  isApproved: boolean;
}[] = [];

async function main() {
  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  if (!owner) {
    console.error('No OWNER user found. Run the seed script first.');
    process.exit(1);
  }
  console.log(`Using owner: ${owner.name} (ID: ${owner.id})`);

  const existing = await prisma.property.findMany({ select: { title: true } });
  const existingTitles = new Set(existing.map(p => p.title));

  let count = 0;
  let imageIndex = 0;

  for (const district of districts) {
    const titles = titlesByDistrict[district.name];
    for (const title of titles) {
      if (existingTitles.has(title)) continue;

      const bd = title.includes('Studio') ? 1 : title.includes('1-Bedroom') ? 1 : title.includes('2-Bedroom') ? 2 : title.includes('3-Bedroom') ? 3 : title.includes('4-Bedroom') ? 4 : title.includes('5-Bedroom') ? 5 : Math.floor(Math.random() * 3) + 1;
      const ba = Math.max(1, bd - Math.floor(Math.random() * 2));
      const area = title.includes('Studio') ? rand(25, 45, 0) : bd === 1 ? rand(40, 70, 0) : bd === 2 ? rand(70, 110, 0) : bd === 3 ? rand(100, 160, 0) : bd >= 4 ? rand(160, 400, 0) : rand(50, 150, 0);

      const pricePerBed = rand(0.08, 0.4);
      const price = parseFloat((bd * pricePerBed).toFixed(3));
      const deposit = parseFloat((price * 0.4).toFixed(3));

      const location = district.locations[Math.floor(Math.random() * district.locations.length)];
      const lat = randCoord(district.lat);
      const lng = randCoord(district.lng);
      const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
      const amCount = Math.floor(Math.random() * 6) + 3;
      const ams = pick(amenitiesList, amCount);

      const imgCount = Math.floor(Math.random() * 3) + 2;
      const imgs: string[] = [];
      for (let i = 0; i < imgCount; i++) {
        imgs.push(images[imageIndex % images.length]);
        imageIndex++;
      }

      allPropertyData.push({
        ownerId: owner.id,
        title,
        description: desc,
        location,
        district: district.name,
        lat,
        lng,
        priceEth: price.toString(),
        depositEth: deposit.toString(),
        images: JSON.stringify(imgs),
        bedrooms: bd,
        bathrooms: ba,
        area,
        amenities: JSON.stringify(ams),
        isApproved: true,
      });
      count++;
    }
  }

  console.log(`Inserting ${count} new properties...`);

  for (const prop of allPropertyData) {
    await prisma.property.create({ data: prop });
    console.log(`  Created: ${prop.title} (${prop.district}, ${prop.priceEth} ETH)`);
  }

  console.log(`\nDone! ${count} properties added. Total: ${await prisma.property.count()}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
