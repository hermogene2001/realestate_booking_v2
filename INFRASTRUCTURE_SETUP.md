# Infrastructure Setup Guide

## New Features Implemented

### 1. Rate Limiting ✅
- File: backend/src/middleware/rateLimiter.ts
- IP-based rate limiting with configurable limits
- Different limits for auth, payments, search, messaging

### 2. IP Blocking & User Bans ✅
- File: backend/src/middleware/security.ts
- Block malicious IPs
- Ban user accounts

### 3. Redis Caching ✅
- File: backend/src/services/cache.service.ts
- Redis with in-memory fallback
- Cache middleware for GET requests

### 4. Sentry Monitoring ✅
- File: backend/src/services/sentry.service.ts
- Error tracking
- Performance monitoring
- User tracking

### 5. Swagger API Docs ✅
- File: backend/src/config/swagger.ts
- Auto-generated API documentation
- Available at /api-docs

## Required Packages

Run this command to install all new dependencies:

```bash
cd backend
npm install redis @sentry/node swagger-jsdoc swagger-ui-express
```

## Environment Variables

Add to backend/.env:

```env
# Redis (Optional - will use in-memory cache if not set)
REDIS_URL=redis://localhost:6379

# Sentry (Optional - error monitoring)
SENTRY_DSN=https://your-dsn@sentry.io/your-project
```

## Database Indexes Added

Already optimized with indexes on:
- Messages (senderId, receiverId, propertyId, isRead)
- Disputes (bookingId, status, raisedBy)
- PromoCodes (code, isActive)
- BlogPosts (slug, status, authorId)
- Insurance (bookingId, policyNumber)
- RewardTokens (userId, type)
- Agents (userId, licenseNumber)

## How to Use

### Rate Limiting
```typescript
import { rateLimits } from './middleware/rateLimiter';

app.use('/api/auth', rateLimits.auth);
app.use('/api/payments', rateLimits.payment);
```

### Redis Caching
```typescript
import { cacheMiddleware } from './services/cache.service';

app.get('/api/properties', cacheMiddleware(300), async (req, res) => {
  // Response will be cached for 5 minutes
});
```

### Sentry Monitoring
```typescript
import { SentryService } from './services/sentry.service';

// Initialize in index.ts
SentryService.initialize();

// Capture errors
SentryService.captureException(error, { userId: 123 });
```

### Swagger Docs
```typescript
import { setupSwagger } from './config/swagger';

// Add to index.ts
setupSwagger(app);

// Access at: http://localhost:5000/api-docs
```

## Next Steps

1. Install packages: `npm install redis @sentry/node swagger-jsdoc swagger-ui-express`
2. Add environment variables to .env
3. Start Redis server (optional)
4. Create Sentry account and get DSN (optional)
5. Register middleware in index.ts
6. Test everything!
