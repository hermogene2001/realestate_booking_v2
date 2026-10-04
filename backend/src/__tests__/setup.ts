// Test setup file
import { prisma } from '../config/database';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'file:./test.db';

// Global test setup
beforeAll(async () => {
  // Clean database before tests
  await cleanDatabase();
});

// Clean database after each test
afterEach(async () => {
  await cleanDatabase();
});

async function cleanDatabase() {
  try {
    // Delete in correct order to avoid foreign key constraints
    await prisma.rewardToken.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.insurance.deleteMany();
    await prisma.blogPost.deleteMany();
    await prisma.dispute.deleteMany();
    await prisma.promoCode.deleteMany();
    await prisma.message.deleteMany();
    await prisma.commission.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.property.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}
