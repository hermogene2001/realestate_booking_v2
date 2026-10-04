# 🚀 Quick Start - Security Implementation

**Time to integrate:** ~35 minutes  
**Difficulty:** Medium  
**Impact:** Critical security fixes

---

## ⚡ 5-Minute Overview

Three critical vulnerabilities fixed:

1. **Private Key Exposure** → Now encrypted, never exposed
2. **Weak Error Handling** → Now structured with request IDs
3. **Missing Validation** → Now comprehensive validation middleware

---

## 📋 Integration Steps (Copy-Paste Ready)

### Step 1: Update Database Schema (5 min)

Edit `backend/prisma/schema.prisma`:

```prisma
// Add to User model
model User {
  // ... existing fields
  encryptedPrivateKey String? @map("encrypted_private_key")
  auditLogs AuditLog[]
}

// Add new model at end of file
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

Run migration:
```bash
cd backend
npm run db:migrate
# Name: "add_encrypted_private_key_and_audit_logs"
```

### Step 2: Update Auth Routes (10 min)

Edit `backend/src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { AuthService, AuthError } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validateAndSanitize, validationSchemas } from '../middleware/inputValidation';
import { AuditLogService } from '../services/auditLog.service';
import { TokenBlacklistService } from '../services/tokenBlacklist.service';

const router = Router();

// Register
router.post('/register', 
  validateAndSanitize(validationSchemas.register),
  async (req, res, next) => {
    try {
      const result = await AuthService.register(req.body);
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
      await AuditLogService.logAuth(result.user.id, 'LOGIN', req);
      res.json(result);
    } catch (error) {
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
      await AuditLogService.logWallet(req.user!.id, 'WALLET_CREATED', {
        walletAddress: result.walletAddress,
      }, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Export Private Key
router.get('/wallet/export',
  authenticate,
  async (req, res, next) => {
    try {
      const token = req.query.token as string;
      const result = await AuthService.exportWalletPrivateKey(req.user!.id, token);
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

### Step 3: Update Auth Middleware (5 min)

Edit `backend/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { TokenBlacklistService } from '../services/tokenBlacklist.service';

export interface AuthRequest extends Request {
  userId?: number;
  user?: {
    id: number;
    email: string;
    role: string;
    walletAddress: string | null;
  };
}

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

### Step 4: Test Everything (15 min)

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Test registration
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "Password123!",
    "role": "TENANT"
  }'

# 3. Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'

# 4. Save token from response
TOKEN="eyJ..."

# 5. Test wallet generation
curl -X POST http://localhost:5001/api/auth/wallet/generate \
  -H "Authorization: Bearer $TOKEN"

# 6. Verify private key NOT in response
# Should see: walletAddress and exportUrl
# Should NOT see: privateKey

# 7. Test logout
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 8. Try to use token again - should fail
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
# Should get: TOKEN_REVOKED error
```

---

## ✅ Verification Checklist

- [ ] Database migration applied
- [ ] Auth routes updated
- [ ] Auth middleware updated
- [ ] Registration works
- [ ] Login works
- [ ] Private key NOT exposed
- [ ] Error responses include requestId
- [ ] Error responses include code
- [ ] Logout works
- [ ] Token blacklist works
- [ ] Wallet generation works

---

## 🧪 Quick Tests

### Test 1: Private Key Security
```bash
# Should NOT return privateKey
curl -X POST http://localhost:5001/api/auth/wallet/generate \
  -H "Authorization: Bearer TOKEN"

# ✅ Response has exportUrl, not privateKey
```

### Test 2: Error Codes
```bash
# Should return error code
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}'

# ✅ Response includes code: "INVALID_CREDENTIALS"
```

### Test 3: Request ID
```bash
# Check response headers
curl -i -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}'

# ✅ Response includes X-Request-ID header
```

### Test 4: Input Validation
```bash
# Should reject weak password
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "weak",
    "role": "TENANT"
  }'

# ✅ Response includes validation error details
```

---

## 📊 Files Reference

### Created Files
- `backend/src/middleware/requestId.ts` - Request tracking
- `backend/src/middleware/inputValidation.ts` - Validation schemas
- `backend/src/services/tokenBlacklist.service.ts` - Token revocation
- `backend/src/services/auditLog.service.ts` - Audit logging

### Modified Files
- `backend/src/services/auth.service.ts` - Private key encryption
- `backend/src/middleware/errorHandler.ts` - Structured errors
- `backend/src/index.ts` - Request ID middleware

### Documentation
- `IMPLEMENTATION_GUIDE.md` - Detailed integration steps
- `CRITICAL_FIXES_SUMMARY.md` - Before/after examples
- `PROJECT_IMPROVEMENTS.md` - All recommendations

---

## 🚨 Common Issues

### Issue: "Cannot find module 'tokenBlacklist.service'"
**Solution:** Make sure file is in `backend/src/services/`

### Issue: "Database migration failed"
**Solution:** Check schema syntax, run `npm run db:push` first

### Issue: "Private key still exposed"
**Solution:** Verify auth.service.ts was updated correctly

### Issue: "Request ID not in response"
**Solution:** Check requestId middleware is first in app.use() chain

---

## 📞 Need Help?

1. **Integration:** See `IMPLEMENTATION_GUIDE.md`
2. **Examples:** See `CRITICAL_FIXES_SUMMARY.md`
3. **Code:** Check comments in modified files
4. **Testing:** See test procedures above

---

## ⏱️ Time Breakdown

| Task | Time |
|------|------|
| Database schema | 5 min |
| Auth routes | 10 min |
| Auth middleware | 5 min |
| Testing | 15 min |
| **Total** | **35 min** |

---

## 🎯 Success Criteria

✅ All tests passing  
✅ Private key never exposed  
✅ Error responses include request ID  
✅ Error responses include error code  
✅ Input validation working  
✅ Token blacklist working  
✅ Logout endpoint working  
✅ Audit logging working  

---

**Ready to integrate?** Start with Step 1 above!
