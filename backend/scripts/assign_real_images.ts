import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const imageFiles = Array.from({ length: 19 }, (_, i) => `/uploads/property-online-${i + 1}.jpg`);

function pick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function main() {
  const properties = await prisma.property.findMany({ select: { id: true, title: true, images: true }, orderBy: { id: 'asc' } });
  console.log(`Found ${properties.length} properties`);

  let imgIdx = 0;
  for (const prop of properties) {
    const imgCount = Math.floor(Math.random() * 2) + 2;
    const imgs: string[] = [];
    for (let i = 0; i < imgCount; i++) {
      imgs.push(imageFiles[imgIdx % imageFiles.length]);
      imgIdx++;
    }

    await prisma.property.update({
      where: { id: prop.id },
      data: { images: JSON.stringify(imgs) },
    });
    console.log(`  Updated: ${prop.title} -> ${imgs.join(', ')}`);
  }

  console.log(`\nDone! All ${properties.length} properties now have real images.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
