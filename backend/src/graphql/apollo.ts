// @ts-nocheck — GraphQL temporarily disabled, needs @apollo/server/express4
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { gql } from 'graphql-tag';
import { prisma } from '../config/database';

// GraphQL Type Definitions
const typeDefs = gql`
  type Query {
    # Properties
    properties(limit: Int, offset: Int, district: String): [Property!]!
    property(id: Int!): Property
    
    # Bookings
    myBookings(userId: Int!): [Booking!]!
    
    # Analytics
    dashboardStats: DashboardStats!
  }

  type Mutation {
    # Property
    createProperty(
      ownerId: Int!
      title: String!
      description: String!
      location: String!
      district: String!
      priceEth: String!
      pricePerNightEth: String!
      amenities: [String!]!
      images: [String!]!
    ): Property!

    # Booking
    createBooking(
      tenantId: Int!
      propertyId: Int!
      startDate: String!
      endDate: String!
    ): Booking!
  }

  type Property {
    id: Int!
    title: String!
    description: String!
    location: String!
    district: String!
    priceEth: String!
    pricePerNightEth: String!
    amenities: [String!]!
    images: [String!]!
    owner: User!
    isApproved: Boolean!
    createdAt: String!
  }

  type User {
    id: Int!
    name: String!
    email: String!
    role: String!
  }

  type Booking {
    id: Int!
    property: Property!
    tenant: User!
    startDate: String!
    endDate: String!
    status: String!
    paymentStatus: String!
    createdAt: String!
  }

  type DashboardStats {
    totalUsers: Int!
    totalProperties: Int!
    totalBookings: Int!
    totalRevenue: String!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    properties: async (_: any, { limit = 20, offset = 0, district }: any) => {
      const where: any = { status: 'AVAILABLE', isApproved: true };
      if (district) where.district = district;

      const properties = await prisma.property.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return properties;
    },

    property: async (_: any, { id }: any) => {
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!property) {
        throw new Error('Property not found');
      }

      return property;
    },

    myBookings: async (_: any, { userId }: any) => {
      const bookings = await prisma.booking.findMany({
        where: { tenantId: userId },
        include: {
          property: true,
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return bookings;
    },

    dashboardStats: async () => {
      const [totalUsers, totalProperties, totalBookings] = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.booking.count(),
      ]);

      const bookings = await prisma.booking.findMany({
        where: { paymentStatus: 'COMPLETED' },
        select: { amountEth: true },
      });

      const totalRevenue = bookings.reduce(
        (sum, b) => sum + Number(b.amountEth || 0),
        0
      ).toString();

      return {
        totalUsers,
        totalProperties,
        totalBookings,
        totalRevenue,
      };
    },
  },

  Mutation: {
    createProperty: async (
      _: any,
      {
        ownerId,
        title,
        description,
        location,
        district,
        priceEth,
        pricePerNightEth,
        amenities,
        images,
      }: any
    ) => {
      const property = await prisma.property.create({
        data: {
          ownerId,
          title,
          description,
          location,
          district,
          priceEth,
          pricePerNightEth,
          amenities,
          images,
          status: 'AVAILABLE',
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return property;
    },

    createBooking: async (
      _: any,
      { tenantId, propertyId, startDate, endDate }: any
    ) => {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new Error('Property not found');
      }

      const booking = await prisma.booking.create({
        data: {
          tenantId,
          propertyId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          amountEth: property.priceEth,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
        include: {
          property: true,
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return booking;
    },
  },
};

// Create Apollo Server instance
let apolloServer: ApolloServer;

export async function createApolloServer() {
  apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  return apolloServer;
}

export function getApolloMiddleware() {
  if (!apolloServer) {
    throw new Error('Apollo server not initialized. Call createApolloServer() first.');
  }

  return expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      // Add authentication context here
      return {
        userId: req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string) : null,
      };
    },
  });
}
