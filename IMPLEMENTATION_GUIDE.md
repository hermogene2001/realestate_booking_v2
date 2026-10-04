# Security Implementation Guide

**Date:** May 3, 2026  
**Status:** Critical Security Fixes Applied  
**Next Steps:** Integration & Testing

---

## 📋 What Was Implemented

### ✅ Completed
1. **Private Key Encryption** - `backend/src/services/auth.service.ts`
2. **Structured Error Handling** - `backend/src/middleware/errorHandler.ts`
3. **Request ID Tracking** - `backend/src/middleware/requestId.ts`
4. **Input Validation** - `backend/src/middleware/inputValidation.ts`
5. **Token Blacklist Service** - `backend/src/services/tokenBlacklist.service.ts`
6. **Audit Logging Service** - `backend/src/services/auditLog.service.ts`
7. **Environment Template** - `backend/.env.example`

---

## 🔧 Integration Steps

### Step 1: Update Database Schema

Add these models to `backend/prisma/schema.prisma`:

```prisma
// Add to User model
model User {
  // ... existing fields
  encryptedPrivateKey String? @map("encrypted_private_key")
  
  // Add relation for audit logs
  auditLogs AuditLog[]
}

// Add new model for audit logging
model AuditLog {
  id        Int     @id @default(autoincrement())
  userId    Int     @map("user_id")
  action    String
  details   Json
  ipAddress String? @map("ip_address")
  userAgent String? @map("user_agent")
  timestamp DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([timestamp])
  @@map("audit_logs")
}
```

**Run migration:**
```bash
cd backend
npm run db:migrate
# Name it: "add_encrypted_private_key_and_audit_logs"
```

---

### Step 2: Update Auth Routes

Update `backend/src/routes/auth.routes.ts` to use new error handling:

```typescript
import { Router } from 'express';
import { AuthService, AuthError } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validateAndSanitize, validationSchemas } from '../middleware/inputValidation';
import { AuditLogService } from '../services/auditLog.service';

const router = Router();

// Register
router.post('/register', 
  validateAndSanitize(validationSchemas.register),
  async (req, res, next) => {
    try {
      const result = await AuthService.register(req.body);
      
      // Log registration
      await AuditLogService.logAuth(result.user.id, 'REGISTER', req);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post('/login',
  validateAndSanitize(validationSchemas.login),
  async (req, res, next) => {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);
      
      // Log login
      await AuditLogService.logAuth(result.user.id, 'LOGIN', req);
      
      res.json(result);
    } catch (error) {
      // Log failed login
      if (error instanceof AuthError && req.body.email) {
        await AuditLogService.logSecurity(null, 'FAILED_LOGIN', {
          email: req.body.email,
          reason: error.message,
        }, req);
      }
      next(error);
    }
  }
);

// Logout
router.post('/logout',
  authenticate,
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        TokenBlacklistService.blacklistFromToken(token);
      }
      
      // Log logout
      await AuditLogService.logAuth(req.user?.id || 0, 'LOGOUT', req);
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Generate Wallet
router.post('/wallet/generate',
  authenticate,
  async (req, res, next) => {
    try {
      const result = await AuthService.generateWallet(req.user!.id);
      
      // Log wallet creation
      await AuditLogService.logWallet(req.user!.id, 'WALLET_CREATED', {
        walletAddress: result.walletAddress,
      }, req);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Export Private Key (secure endpoint)
router.get('/wallet/export',
  authenticate,
  async (req, res, next) => {
    try {
      const token = req.query.token as string;
      const result = await AuthService.exportWalletPrivateKey(req.user!.id, token);
      
      // Log key export
      await AuditLogService.logWallet(req.user!.id, 'PRIVATE_KEY_EXPORTED', {
        timestamp: new Date().toISOString(),
      }, req);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

---

### Step 3: Update Main App File

The request ID middleware has already been added to `backend/src/index.ts`. Verify it's there:

```typescript
// Should be at the top of middleware stack
app.use(requestIdMiddleware);
```

---

### Step 4: Add Logout Endpoint

Create logout functionality in auth routes:

```typescript
import { TokenBlacklistService } from '../services/tokenBlacklist.service';

router.post('/logout', authenticate, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    TokenBlacklistService.blacklistFromToken(token);
  }
  res.json({ message: 'Logged out successfully' });
});
```

---

### Step 5: Update Auth Middleware

Update `backend/src/middleware/auth.ts` to check token blacklist:

```typescript
import { TokenBlacklistService } from '../services/tokenBlacklist.service';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'MISSING_TOKEN',
        requestId: req.id,
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted
    if (TokenBlacklistService.isBlacklisted(token)) {
      return res.status(401).json({
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED',
        requestId: req.id,
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId: req.id,
      });
    }

    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      requestId: req.id,
    });
  }
};
```

---

## 🧪 Testing

### Test 1: Private Key Not Exposed

```bash
# Generate wallet
curl -X POST http://localhost:5001/api/auth/wallet/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Response should NOT contain privateKey
# Should contain exportUrl instead
```

**Expected Response:**
```json
{
  "user": { "id": 1, "email": "user@example.com" },
  "walletAddress": "0x...",
  "exportUrl": "/api/auth/wallet/export?token=eyJ..."
}
```

### Test 2: Error Handling with Request ID

```bash
# Try invalid login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}'

# Response should include requestId and error code
```

**Expected Response:**
```json
{
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS",
  "requestId": "1234567890-abc123"
}
```

### Test 3: Input Validation

```bash
# Try weak password
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "weak",
    "role": "TENANT"
  }'

# Should return validation error
```

**Expected Response:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "requestId": "1234567890-abc123",
  "details": [
    {
      "field": "password",
      "message": "String must contain at least 8 character(s)",
      "code": "too_small"
    }
  ]
}
```

### Test 4: Token Blacklist on Logout

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123!"}'

# Get token from response
TOKEN="eyJ..."

# Logout
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Try to use token again - should fail
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# Should return TOKEN_REVOKED error
```

---

## 📊 Verification Checklist

- [ ] Database migration created and applied
- [ ] Auth routes updated with new error handling
- [ ] Request ID middleware working (check response headers)
- [ ] Token blacklist service integrated
- [ ] Audit logging service integrated
- [ ] Private key never exposed in responses
- [ ] Error responses include request ID
- [ ] Input validation working on all endpoints
- [ ] Logout endpoint blacklists tokens
- [ ] Tests passing

---

## 🚀 Next Priority Items

### High Priority (This Week)
1. [ ] Database indexes for performance
2. [ ] Rate limiting on sensitive endpoints
3. [ ] RBAC enforcement on all routes
4. [ ] Sentry integration for error tracking

### Medium Priority (Next Week)
5. [ ] GraphQL Apollo version fix
6. [ ] API documentation completion
7. [ ] Integration tests for critical flows
8. [ ] Performance optimization

### Low Priority (Future)
9. [ ] Microservices architecture
10. [ ] Advanced caching strategy
11. [ ] Load testing
12. [ ] Disaster recovery plan

---

## 📝 Configuration Checklist

Before deploying to production:

- [ ] Rotate JWT secrets
- [ ] Generate new Hardhat private key
- [ ] Set up Sentry DSN
- [ ] Configure Redis for production
- [ ] Enable HTTPS/TLS
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable CORS for production domain
- [ ] Set up monitoring and alerting
- [ ] Create deployment runbook

---

## 🔗 Related Files

- `PROJECT_IMPROVEMENTS.md` - Detailed improvement recommendations
- `SECURITY_FIXES_APPLIED.md` - Summary of security fixes
- `backend/.env.example` - Environment template
- `backend/src/services/auth.service.ts` - Updated auth service
- `backend/src/middleware/errorHandler.ts` - Improved error handler
- `backend/src/middleware/requestId.ts` - Request ID middleware
- `backend/src/middleware/inputValidation.ts` - Input validation
- `backend/src/services/tokenBlacklist.service.ts` - Token blacklist
- `backend/src/services/auditLog.service.ts` - Audit logging

---

## 💡 Tips

1. **Testing Locally:** Use Postman or curl to test endpoints
2. **Debugging:** Check request ID in response headers
3. **Logging:** All errors are logged with structured JSON format
4. **Performance:** Token blacklist uses in-memory storage; switch to Redis for production
5. **Security:** Always validate and sanitize user input

---

**Last Updated:** May 3, 2026  
**Status:** Ready for Integration Testing
