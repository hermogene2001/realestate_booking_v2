# Kigali Real Estate Booking Platform — System Overview

## 1. Architecture

**Backend**: Node.js + Express + TypeScript (REST API, no GraphQL in production)
**Database**: SQLite via Prisma ORM
**Authentication**: JWT (access + refresh tokens)
**Payments**: Ethereum (smart contract escrow), MTN MoMo, Card (Stripe)

The server runs on a single Express process. Background workers (cron-based) handle booking timeouts and fraud detection scans.

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.3 |
| Framework | Express 4.18 |
| ORM | Prisma 5.8 |
| Auth | jsonwebtoken + bcryptjs |
| Validation | Zod |
| File Upload | Multer |
| Email | Nodemailer |
| SMS / MoMo | Direct API integration |
| ETH / Smart Contract | ethers.js |
| 2FA | speakeasy + QRCode |
| Monitoring | Sentry |
| Scheduling | node-cron |
| Cache | Redis (optional) |
| Docs | Swagger (OpenAPI 3.0) |

## 3. Database Schema (14 models)

- **User** — roles: TENANT, OWNER, ADMIN; supports wallet linking, 2FA, ban/verify status
- **Property** — location (lat/lng/district), pricing in ETH, images, amenities, approval workflow, document requirements
- **Booking** — status lifecycle (PENDING → LOCKED → COMPLETED / CANCELLED / DISPUTED), escrow tracking, timeout handling
- **Payment** — multi-currency (ETH, USD, RWF), multiple providers (ETHEREUM, MOMO, CARD)
- **Transaction** — on-chain escrow records (DEPOSIT, RELEASE, REFUND, CANCEL, FEE)
- **Review** — tied to completed bookings, supports owner replies and photos
- **Notification** — typed (NotificationType enum), JSON metadata, read tracking
- **FraudAlert** — auto-detected by hourly scan, adjustable severity
- **Dispute** — booking disputes with resolution workflow
- **Commission** — platform fee tracking per booking
- **PropertyDocument** — KYC-style document upload (UPI, Land Title, etc.) with approve/reject
- **Message** — direct tenant-owner messaging per property
- **Favorite** — F#!$%!t user property wishlists
- **Verification** — ID document + selfie verification flow

## 4. API Routes

### Public / Unauthenticated

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/properties` | List/search properties (filterable) |
| GET | `/api/properties/:id` | Get property detail |
| GET | `/api/properties/:id/reviews` | Get property reviews |
| GET | `/api/search` | Full-text property search with filters |
| GET | `/api/search/suggestions` | Autocomplete suggestions |
| GET | `/api/search/popular` | Popular search districts |
| GET | `/api/price/eth` | Current ETH price (CoinGecko + cache) |
| POST | `/api/auth/register` | Register (TENANT or OWNER) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh JWT |

### Authenticated (JWT Bearer token required)

**Auth**
- `GET /api/auth/me` — Get profile
- `PATCH /api/auth/profile` — Update profile
- `PATCH /api/auth/wallet` — Link wallet address
- `POST /api/auth/wallet/generate` — Generate new Ethereum wallet

**Properties** (OWNER role)
- `POST /api/properties` — Create property (with image upload)
- `PUT /api/properties/:id` — Update property
- `DELETE /api/properties/:id` — Delete property
- `GET /api/properties/owner/mine` — My properties

**Bookings** (TENANT and OWNER)
- `POST /api/bookings` — Create booking request (TENANT)
- `GET /api/bookings` — My bookings
- `GET /api/bookings/:id` — Booking detail
- `PATCH /api/bookings/:id/tx` — Record deposit tx hash
- `PATCH /api/bookings/:id/confirm` — Confirm handover
- `PATCH /api/bookings/:id/cancel` — Cancel booking
- `PATCH /api/bookings/:id/dispute` — Raise dispute
- `PATCH /api/bookings/:id/dates` — Modify dates (PENDING only)

**Payments**
- `POST /api/payments/convert` — Currency conversion
- `POST /api/payments/eth/manual` — Manual ETH payment
- `POST /api/payments/momo/initiate` — Start MoMo payment
- `POST /api/payments/momo/confirm` — Confirm MoMo
- `POST /api/payments/card/initiate` — Start card payment
- `POST /api/payments/card/confirm` — Confirm card payment
- `GET /api/payments/my-payments` — Payment history
- `GET /api/payments/stats` — Payment stats
- `POST /api/payments/:id/refund` — Refund booking

**Notifications**
- `GET /api/notifications` — List notifications
- `PATCH /api/notifications/:id/read` — Mark read
- `PATCH /api/notifications/read-all` — Mark all read

**2FA**
- `POST /api/2fa/setup` — Initiate 2FA enrollment
- `POST /api/2fa/verify` — Verify and enable 2FA
- `POST /api/2fa/validate` — Validate 2FA token
- `POST /api/2fa/disable` — Disable 2FA
- `POST /api/2fa/regenerate-backup-codes` — New backup codes

**KYC / Verification**
- `POST /api/kyc/submit` — Submit verification documents
- `GET /api/kyc/status` — Check verification status

**Wishlist / Favorites**
- `POST /api/wishlist/properties/:id/favorite` — Add to favorites
- `DELETE /api/wishlist/properties/:id/favorite` — Remove
- `GET /api/wishlist/favorites` — List favorites
- `GET /api/wishlist/properties/:id/check` — Check if favorited
- `GET /api/wishlist/properties/:id/count` — Favorite count

**AI Assistant** (LLM-powered)
- `POST /api/ai/chat` — Chat with AI assistant
- `GET /api/ai/history` — Conversation history

**Messaging**
- `POST /api/messages` — Send message
- `GET /api/messages/conversations` — List conversations
- `GET /api/messages/conversations/:userId` — Get conversation
- `PATCH /api/messages/:id/read` — Mark message read

### Admin Routes (`/api/admin` — ADMIN role required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Platform overview (users, properties, bookings, escrow) |
| GET | `/users` | List/manage users |
| PATCH | `/users/:id/ban` | Ban/unban user |
| PATCH | `/users/:id/role` | Change user role |
| GET | `/bookings` | All bookings |
| GET | `/transactions` | All transactions |
| GET | `/properties/pending` | Pending properties with documents |
| GET | `/fraud-alerts` | Fraud alerts list |
| GET | `/fraud-alerts/stats` | Fraud statistics |
| POST | `/fraud-alerts/scan` | Trigger manual fraud scan |
| PATCH | `/fraud-alerts/:id` | Resolve fraud alert |
| GET | `/reviews` | All reviews |
| DELETE | `/reviews/:id` | Delete review |
| GET | `/disputes` | Dispute list |
| GET | `/disputes/stats` | Dispute statistics |
| PATCH | `/disputes/:id/resolve` | Resolve dispute |
| GET | `/payments` | All payments |
| GET | `/commissions` | Commission ledger |
| PATCH | `/commissions/:id/pay` | Mark commission paid |
| GET | `/promo-codes` | List promo codes |
| POST | `/promo-codes` | Create promo code |
| PATCH | `/promo-codes/:id` | Update promo code |
| DELETE | `/promo-codes/:id` | Delete promo code |
| GET | `/reports` | Monthly reports & analytics |

### Property Documents (`/api/properties/:id/documents`, admin variants)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/properties/:propertyId/documents` | Upload document (OWNER) |
| GET | `/properties/:propertyId/documents` | List documents |
| GET | `/properties/:propertyId/documents/:documentId` | Get document |
| DELETE | `/properties/:propertyId/documents/:documentId` | Delete document |
| PATCH | `/admin/properties/:propertyId/documents/:documentId/approve` | Approve (ADMIN) |
| PATCH | `/admin/properties/:propertyId/documents/:documentId/reject` | Reject (ADMIN) |
| GET | `/admin/properties/approval-status/:propertyId` | Approval status (ADMIN) |
| PATCH | `/admin/properties/:propertyId/approve` | Approve with document check (ADMIN) |
| PATCH | `/admin/properties/:propertyId/reject` | Reject property (ADMIN) |
| GET | `/admin/properties/pending` | Pending properties (ADMIN) |

## 5. Core Business Flows

### Property Listing & Approval

1. **Owner** registers → creates property via `POST /api/properties` (with images)
2. **Owner** uploads required documents (UPI, Land Title, etc.) via `POST /api/properties/:id/documents`
3. **Admin** reviews documents → approves or rejects each via admin document endpoints
4. **Admin** approves property listing via `PATCH /api/admin/properties/:propertyId/approve` — checks that all required documents are approved
5. Property becomes visible to TENANTs in search results

### Booking & Escrow Flow

1. **Tenant** searches/browses properties → views detail
2. **Tenant** creates booking request → booking enters **PENDING** status
3. **Tenant** deposits ETH into smart contract escrow → records tx hash via `PATCH /api/bookings/:id/tx`
4. Booking transitions to **LOCKED** state
5. **Tenant** moves in / takes possession → confirms handover (`PATCH /api/bookings/:id/confirm`)
6. If **Owner** also confirms → booking transitions to **COMPLETED**, escrow released to owner
7. If no one confirms within the timeout window, the **BookingTimeoutWorker** auto-cancels and refunds

### Dispute Resolution

1. Either party can raise a dispute (`PATCH /api/bookings/:id/dispute`)
2. **Admin** reviews via `/api/admin/disputes/*`
3. Admin resolves with resolution decision → booking transitions to DISPUTED → RESOLVED

### Payment Methods

- **Ethereum**: Tenant deposits ETH into smart contract escrow. Released to owner on completion, or refunded on cancellation.
- **MTN MoMo**: Initiate via `/api/payments/momo/initiate`, user confirms on phone, then confirm via `/api/payments/momo/confirm`.
- **Card**: Initiate via `/api/payments/card/initiate`, confirm via `/api/payments/card/confirm`.

## 6. Blockchain Integration (Escrow)

### Architecture

The platform uses an **Ethereum smart contract** (`RealEstateEscrow.sol`) as an escrow layer between tenants and owners.

**Smart Contract** (located in `blockchain/contracts/RealEstateEscrow.sol`):
- Written in Solidity ^0.8.24, inherits `ReentrancyGuard` and `Pausable`
- Deploys with a configurable **platform fee** (2.5% = 250 basis points)
- Tracks bookings as a state machine: `Created → Locked → Completed/Refunded/Cancelled/Disputed`
- Both tenant and owner must confirm handover before funds release
- 7 events emitted: `BookingCreated`, `Deposited`, `HandoverConfirmed`, `FundsReleased`, `TenantRefunded`, `BookingCancelled`, `DisputeRaised`, `DisputeResolved`
- Admin functions: `refundTenant`, `setPlatformFee`, `withdrawFees`, `pause/unpause`, `transferAdmin`

**Deployment**:
- Compiled with Hardhat using Solidity 0.8.25 optimizer (200 runs)
- Deploy script `blockchain/scripts/deploy.ts` sets fee to 250 bps
- Supports deployment to: **localhost**, **Sepolia**, **Polygon**, **Mumbai**, **Arbitrum**, **BSC**, **Optimism**, **Base**
- Run: `cd blockchain && npm run deploy:local` or `npm run deploy:sepolia`

### Backend Integration

The `BlockchainService` (`backend/src/services/blockchain.service.ts`) uses **ethers.js v6** to:
- Call `contract.createBooking(propertyId, ownerAddress, timeoutDuration)` — payable, locks ETH
- Call `contract.confirmHandover(bookingId)` — tenant/owner handover confirmation
- Call `contract.cancelBooking(bookingId)` — cancels with optional penalty
- Call `contract.raiseDispute(bookingId)` — raises a dispute
- Call `contract.resolveDispute(bookingId, refundBuyer)` — admin resolves dispute
- Poll contract state via `getBooking(bookingId)` and `getBookingCount()`

**How payments flow to blockchain:**

1. **Direct ETH payment**: Tenant sends ETH directly to contract → recorded on-chain
2. **MoMo/Card payment**: Admin wallet receives fiat → `BlockchainService.submitEscrow()` deposits equivalent ETH on behalf of user → both fiat + on-chain records exist

**Connection details** (configured in `.env`):
```
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ADMIN_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
ADMIN_WALLET_PRIVATE_KEY=<private key>
```

### Transaction Records in DB

Every blockchain transaction hash is also stored in the `Transaction` table (PostgreSQL) for offline/on-chain audit:
- `txHash` — the on-chain transaction hash
- `type` — DEPOSIT, RELEASE, REFUND, CANCEL, FEE
- `fromAddress` / `toAddress`
- Linked to `bookingId` via foreign key

### Graceful Degradation

If the blockchain node is unreachable (`BlockchainService.isAvailable()` returns false), fiat payments still process with a simulated `txHash`. This allows the platform to function even temporarily disconnected from the chain.

## 7. Background Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Booking Timeout Cancellation | Every 15 minutes | Auto-cancels PENDING bookings where deposit not received within the 30-day timeout window |
| Timeout Warning Notifications | Daily at 09:00 Kigali | Sends reminders to tenants whose bookings are approaching the timeout deadline |
| Fraud Detection Scan | Every hour | Runs 6 fraud rules (rapid bookings, rapid cancellations, quick handovers, duplicate wallets, price manipulation, same-IP) and creates FraudAlert records |

## 8. Security Features

- **JWT authentication** with access + refresh token pattern
- **Role-based access control** (TENANT / OWNER / ADMIN) via middleware
- **2FA** with TOTP (speakeasy) + backup codes
- **Rate limiting** via express-rate-limit middleware
- **Input validation** with Zod schemas
- **File upload validation** (type, size, ownership checks)
- **Banned user** enforcement at auth middleware level
- **Optional auth** — endpoints that work with or without authentication
- **Sentry error tracking** with environment-aware filtering
- **Request ID tracking** across all requests
- **Fraud detection** system with automated + manual scanning
- **CORS** restricted to configured FRONTEND_URL

## 9. Middleware Pipeline (order matters)

1. `requestIdMiddleware` — assigns unique ID to every request
2. `cors` — cross-origin restrictions
3. `express.json` / `urlencoded` — body parsing
4. Static file serving for `/uploads`
5. Route-specific: `authenticate` / `optionalAuth` → `authorize(roles)` → `zodValidate` → handler
6. `errorHandler` — global error catch-all

## 10. Developer Notes

- **Start**: `npm run dev` (ts-node-dev with hot reload)
- **Build**: `npm run build` (tsc → `dist/`)
- **DB migrate**: `npm run db:migrate`
- **DB seed**: `npm run db:seed`
- **Run tests**: `npm test`
- **API docs**: Swagger UI at `http://localhost:5000/api-docs`
- **Prisma Studio**: `npm run db:studio` (browser-based database viewer)

## 11. Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── index.ts               # Express app setup, route mounting, cron jobs
│   ├── config/
│   │   ├── env.ts             # Environment variables
│   │   ├── database.ts        # Prisma client singleton
│   │   ├── swagger.ts         # OpenAPI documentation setup
│   │   └── documentUpload.ts  # Multer config for documents
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication + optional auth
│   │   ├── rbac.ts            # Role-based authorization
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── requestId.ts       # Request ID generator
│   │   ├── rateLimiter.ts     # Rate limiting
│   │   ├── documentUpload.ts  # Multer config for property docs
│   │   ├── upload.ts          # Multer config for property images
│   │   ├── security.ts        # Security headers
│   │   ├── validate.ts        # Validation middleware
│   │   └── zodValidate.ts     # Zod validation middleware
│   ├── routes/                # 15 route files (one per resource)
│   ├── services/              # 31 service files (business logic)
│   ├── schemas/               # Zod schemas
│   ├── workers/               # Background job workers
│   └── __tests__/             # Jest test suites
└── package.json
```
