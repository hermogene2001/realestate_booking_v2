import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
  console.log('Users:', JSON.stringify(users, null, 2));

  const props = await prisma.property.findMany({ select: { id: true, title: true, district: true, images: true } });
  console.log('Properties count:', props.length);
  console.log('Properties:', JSON.stringify(props, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
