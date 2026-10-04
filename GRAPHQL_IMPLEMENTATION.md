# GraphQL API Implementation Guide

## Overview
GraphQL provides a flexible, efficient alternative to REST API for the Kigali Real Estate Platform.

## Installation

```bash
cd backend
npm install @apollo/server graphql graphql-tag
```

## Schema Definition

Create `backend/src/graphql/schema.graphql`:

```graphql
type Query {
  # Properties
  properties(where: PropertyFilterInput, limit: Int, offset: Int): [Property!]!
  property(id: ID!): Property
  
  # Users
  me: User
  user(id: ID!): User
  
  # Bookings
  myBookings: [Booking!]!
  booking(id: ID!): Booking
  
  # Analytics
  dashboardStats: DashboardStats
}

type Mutation {
  # Property
  createProperty(input: CreatePropertyInput!): Property!
  updateProperty(id: ID!, input: UpdatePropertyInput!): Property!
  
  # Booking
  createBooking(input: CreateBookingInput!): Booking!
  confirmBooking(id: ID!): Booking!
  
  # Review
  createReview(input: CreateReviewInput!): Review!
  
  # Auth
  login(email: String!, password: String!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!
}

type Property {
  id: ID!
  title: String!
  description: String!
  location: String!
  district: String!
  priceEth: String!
  priceUsd: String
  priceRwf: String
  images: [String!]!
  amenities: [String!]!
  owner: User!
  bookings: [Booking!]!
  reviews: [Review!]!
  isAvailable: Boolean!
  createdAt: String!
}

type User {
  id: ID!
  name: String!
  email: String!
  role: String!
  walletAddress: String
  phone: String
}

type Booking {
  id: ID!
  property: Property!
  tenant: User!
  status: String!
  startDate: String!
  endDate: String!
  paymentStatus: String!
  createdAt: String!
}

type Review {
  id: ID!
  property: Property!
  user: User!
  rating: Int!
  comment: String!
  createdAt: String!
}

type AuthPayload {
  accessToken: String!
  refreshToken: String!
  user: User!
}

type DashboardStats {
  totalUsers: Int!
  totalProperties: Int!
  totalBookings: Int!
  totalRevenue: Float!
}

input PropertyFilterInput {
  district: String
  minPrice: Float
  maxPrice: Float
  amenities: [String!]
}

input CreatePropertyInput {
  title: String!
  description: String!
  location: String!
  district: String!
  priceEth: String!
  images: [String!]!
  amenities: [String!]!
}

input UpdatePropertyInput {
  title: String
  description: String
  priceEth: String
  images: [String!]
  amenities: [String!]
}

input CreateBookingInput {
  propertyId: ID!
  startDate: String!
  endDate: String!
}

input CreateReviewInput {
  propertyId: ID!
  bookingId: ID!
  rating: Int!
  comment: String!
}

input RegisterInput {
  name: String!
  email: String!
  phone: String!
  password: String!
  role: String!
}
```

## Resolvers

Create `backend/src/graphql/resolvers.ts`:

```typescript
import { AuthService } from '../services/auth.service';
import { PropertyService } from '../services/property.service';
import { BookingService } from '../services/booking.service';
import { AnalyticsService } from '../services/analytics.service';

export const resolvers = {
  Query: {
    properties: async (_: any, { where, limit = 20, offset = 0 }: any) => {
      return PropertyService.getProperties(limit, offset, where);
    },
    
    property: async (_: any, { id }: any) => {
      return PropertyService.getPropertyById(parseInt(id));
    },
    
    me: async (_: any, __: any, context: any) => {
      return context.user;
    },
    
    myBookings: async (_: any, __: any, context: any) => {
      return BookingService.getUserBookings(context.user.id);
    },
    
    dashboardStats: async () => {
      return AnalyticsService.getDashboardStats();
    },
  },
  
  Mutation: {
    login: async (_: any, { email, password }: any) => {
      return AuthService.login(email, password);
    },
    
    register: async (_: any, { input }: any) => {
      return AuthService.register(input);
    },
    
    createProperty: async (_: any, { input }: any, context: any) => {
      return PropertyService.createProperty(context.user.id, input);
    },
    
    createBooking: async (_: any, { input }: any, context: any) => {
      return BookingService.createBooking(context.user.id, input);
    },
  },
  
  Property: {
    owner: async (property: any) => {
      // Load owner
      return property.owner;
    },
    
    isAvailable: async (property: any) => {
      return property.status === 'AVAILABLE';
    },
  },
};
```

## Apollo Server Setup

Create `backend/src/graphql/apollo.ts`:

```typescript
import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { resolvers } from './resolvers';
import { authenticate } from '../middleware/auth';

const typeDefs = readFileSync('./src/graphql/schema.graphql', 'utf-8');

export async function createApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      // Authenticate user
      try {
        const user = await authenticate(req);
        return { user };
      } catch {
        return { user: null };
      },
    },
  });

  return server;
}
```

## Integration with Express

Add to `backend/src/index.ts`:

```typescript
import { expressMiddleware } from '@apollo/server/express4';
import { createApolloServer } from './graphql/apollo';

async function startServer() {
  const apolloServer = await createApolloServer();
  await apolloServer.start();
  
  app.use('/graphql', expressMiddleware(apolloServer));
}
```

## Example Queries

### Get Properties
```graphql
query {
  properties(limit: 10, where: { district: "Nyarugenge" }) {
    id
    title
    priceEth
    images
    owner {
      name
    }
  }
}
```

### Create Booking
```graphql
mutation {
  createBooking(input: {
    propertyId: "1"
    startDate: "2026-05-01"
    endDate: "2026-05-07"
  }) {
    id
    status
    paymentStatus
  }
}
```

### Get Dashboard Stats
```graphql
query {
  dashboardStats {
    totalUsers
    totalProperties
    totalBookings
    totalRevenue
  }
}
```

## Benefits

✅ **Flexible Queries** - Clients request exactly what they need  
✅ **Single Endpoint** - One `/graphql` endpoint for all operations  
✅ **Real-time Updates** - Subscriptions for live data  
✅ **Type Safety** - Strong typing with GraphQL schema  
✅ **Better Performance** - Fetch related data in one request  
✅ **Self-Documenting** - Schema serves as documentation  

## Access GraphQL Playground

After setup, visit:
- **GraphQL Playground:** http://localhost:5000/graphql
- **Schema Explorer:** Built into playground

## Production Considerations

1. **Caching:** Implement DataLoader for N+1 query prevention
2. **Authentication:** JWT tokens in Authorization header
3. **Rate Limiting:** Apply rate limits to GraphQL endpoint
4. **Monitoring:** Track query complexity and execution time
5. **Error Handling:** Consistent error format across queries

## Next Steps

1. Install Apollo packages
2. Create schema.graphql file
3. Create resolvers.ts file
4. Setup Apollo server
5. Integrate with Express
6. Test queries in GraphQL Playground
7. Update frontend to use GraphQL (optional)

---

**Status:** Blueprint Complete - Ready for Implementation  
**Estimated Time:** 2-3 hours to fully implement  
**Priority:** Medium - REST API already functional
