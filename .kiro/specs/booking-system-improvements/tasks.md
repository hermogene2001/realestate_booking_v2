# Implementation Plan: Booking System Improvements

## Overview

15 targeted improvements to the escrow-based booking system. Implementation proceeds in dependency order: schema changes first, then new infrastructure, then service-layer improvements, then routes, then the cron worker, and finally tests.

Tech stack: Node.js, TypeScript, Express, Prisma, MySQL. All dependencies (`zod`, `node-cron`, `@types/node-cron`) are already present in `package.json`.

---

## Tasks

- [x] 1. Prisma schema additions and migration
  - Add `promoCodeId Int? @map("promo_code_id")` and `discountApplied Float @default(0) @map("discount_applied")` fields to the `Booking` model in `backend/prisma/schema.prisma`
  - Add `PAYMENT_FAILED`, `TIMEOUT_WARNING`, and `DISPUTE_RESOLVED` values to the `NotificationType` enum in `backend/prisma/schema.prisma`
  - Add composite index `@@index([status, timeoutAt])` to the `Booking` model for efficient cron queries
  - Run `prisma migrate dev --name add_booking_improvements` to generate and apply the migration
  - _Requirements: 12.6, 13.1, 3.1_

- [x] 2. Zod schemas and validation middleware
  - [x] 2.1 Create `backend/src/schemas/booking.schemas.ts` with the four Zod schemas
    - `createBookingSchema`: `propertyId` positive int, `startDate` ISO datetime, `endDate` ISO datetime, optional `promoCode` string
    - `txSchema`: `txHash` non-empty string, `escrowAmount` string refined to reject `'0'` and non-positive values with message "escrowAmount must be a positive non-zero value"
    - `modifyDatesSchema`: `startDate` and `endDate` ISO datetime strings
    - `disputeSchema`: `reason` string min 20 chars, `againstUserId` positive int
    - _Requirements: 14.2, 14.4, 14.6, 14.8, 15.1, 15.2_

  - [x] 2.2 Create `backend/src/middleware/zodValidate.ts` middleware
    - Export `zodValidate(schema: ZodSchema)` that calls `schema.parse(req.body)`, returns `400` with structured errors on `ZodError`, calls `next()` on success
    - Note: the existing `validate.ts` wraps `body/query/params` — `zodValidate` should parse `req.body` directly to match the schemas above
    - _Requirements: 14.9_

  - [ ]* 2.3 Write property test for Zod schema validation (Property 27, Property 28)
    - **Property 27: Invalid request bodies are always rejected by Zod before reaching service layer**
    - **Property 28: Zero or missing escrowAmount is always rejected**
    - **Validates: Requirements 14.2, 14.9, 15.1, 15.2, 15.3**

- [x] 3. ExchangeRateClient service
  - [x] 3.1 Create `backend/src/services/exchangeRate.service.ts`
    - Implement `ExchangeRateClient` class with static `getRates(): Promise<ExchangeRates>` method
    - In-memory cache with 5-minute TTL: check `cache.fetchedAt` before making API calls
    - Primary: fetch ETH/USD from `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd` using `axios` (already in node_modules via other services, or use `https` built-in)
    - Secondary: fetch USD/RWF from `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/USD/RWF`
    - On API failure: log warning, return last cached rates; if no cache exists, return hardcoded fallback `{ ETH_USD: 3000, USD_RWF: 1300 }`
    - Never throws — all errors are caught internally
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 3.2 Write property test for ExchangeRateClient (Property 14)
    - **Property 14: Exchange rate cache is idempotent within TTL**
    - **Validates: Requirements 9.3, 9.4**

- [x] 4. BookingService improvements
  - [x] 4.1 Add private `validateDates(startDate: Date, endDate: Date): void` helper to `BookingService`
    - Reject if `startDate < now()` → "Start date cannot be in the past"
    - Reject if `endDate <= startDate` → "End date must be after start date"
    - Reject if duration < 1 day → "Minimum booking duration is 1 day"
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 4.2 Write property tests for date validation (Property 1, Property 2)
    - **Property 1: Invalid date pairs are always rejected**
    - **Property 2: Valid date pairs are always accepted**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [x] 4.3 Update `BookingService.create()` to integrate calendar check and promo code
    - Call `validateDates()` at the start of `create()`
    - Call `CalendarService.getPropertyAvailability()` to check for `isBooked = true` conflicts; reject with "Property is not available for the selected dates" if any found
    - Accept optional `promoCode` in `CreateBookingInput`; if provided, call `PromoCodeService.validatePromoCode()` and `PromoCodeService.usePromoCode()` to get `discountedAmount`, `discountApplied`, and `promoCodeId`
    - Store `promoCodeId` and `discountApplied` on the booking record (new schema fields)
    - After booking creation, call `CalendarService.blockDates()` using the property owner's ID to create the `isBooked = true` availability record linked to the booking
    - Return `contractParams.depositAmount` as discounted amount and `contractParams.originalDepositAmount` as original `depositEth`; set `discountApplied: 0` when no promo
    - _Requirements: 1.1–1.4, 2.1, 2.2, 2.3, 7.1, 7.2, 7.3, 12.1–12.8_

  - [ ]* 4.4 Write property tests for booking creation (Property 3, Property 4, Property 21, Property 22, Property 23, Property 24)
    - **Property 3: Overlapping availability always blocks booking**
    - **Property 4: Successful booking creation always produces an availability record**
    - **Property 21: Invalid promo codes are always rejected**
    - **Property 22: Promo code discount is always non-negative and mathematically correct**
    - **Property 23: Promo code usedCount always increments on application**
    - **Property 24: Booking with promo code always stores discount fields**
    - **Validates: Requirements 2.2, 2.3, 12.2, 12.3, 12.4, 12.5, 12.6, 12.9**

  - [x] 4.5 Update `BookingService.getById()` to enforce authorization
    - Add `requestingUserId: number` and `requestingUserRole: string` parameters
    - After fetching the booking, check: `isTenant || isOwner || isAdmin`; throw "Not authorized to view this booking" if none match
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.6 Write property test for booking authorization (Property 9)
    - **Property 9: Booking detail access is always authorized**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [x] 4.7 Update `BookingService.confirmHandover()` to trigger commission and reset property status
    - When both parties confirmed: update property status to `AVAILABLE` (move existing `BOOKED` update to `COMPLETED` branch)
    - After `booking.update(COMPLETED)`, wrap `CommissionService.createCommission(bookingId)` in try/catch — log error but do not rethrow
    - _Requirements: 4.1, 6.1, 6.2, 6.3_

  - [ ]* 4.8 Write property tests for booking completion (Property 8, Property 10, Property 11)
    - **Property 8: Terminal booking status always resets property to AVAILABLE**
    - **Property 10: Booking completion always triggers commission creation**
    - **Property 11: Commission amounts always sum correctly**
    - **Validates: Requirements 4.1, 4.2, 6.1, 6.3**

  - [x] 4.9 Update `BookingService.cancel()` to trigger refund and reset property status on all cancellations
    - Include `payment` in the `findUnique` include clause
    - If `booking.status === 'LOCKED'` and a payment record exists, call `PaymentService.refundPayment(bookingId)` before updating booking status
    - After updating booking to `CANCELLED`, update property to `AVAILABLE`
    - Send `REFUND_ISSUED` notification to tenant when refund is triggered; send `BOOKING_CANCELLED` notification to owner
    - _Requirements: 4.2, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 4.10 Write property tests for cancellation (Property 8, Property 12, Property 13)
    - **Property 8: Terminal booking status always resets property to AVAILABLE** (cancellation branch)
    - **Property 12: LOCKED booking cancellation always triggers refund**
    - **Property 13: LOCKED booking cancellation always sends REFUND_ISSUED notification**
    - **Validates: Requirements 4.2, 8.1, 8.2, 8.4**

  - [x] 4.11 Update `BookingService.dispute()` to accept and validate `reason` and `againstUserId`
    - Add `reason: string` and `againstUserId: number` parameters
    - Validate `reason.length >= 20`; throw "Dispute reason must be at least 20 characters" if not
    - After updating booking status to `DISPUTED`, call `DisputeService.raiseDispute(userId, bookingId, againstUserId, reason)`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 4.12 Write property test for dispute validation (Property 20)
    - **Property 20: Short dispute reasons are always rejected**
    - **Validates: Requirements 11.2, 11.3**

  - [x] 4.13 Add `BookingService.modifyDates()` method
    - Verify booking exists and `status === 'PENDING'`; throw if not
    - Verify `userId === booking.tenantId`; throw authorization error if not
    - Call `validateDates()` on new dates
    - Check calendar availability for new range, excluding the booking's own `Availability` record (find by `bookingId`)
    - Update `booking.startDate`, `booking.endDate`, and the linked `Availability` record's `date` and `endDate`
    - Send notification to property owner about the date change
    - _Requirements: 10.1–10.9_

  - [ ]* 4.14 Write property tests for date modification (Property 16, Property 17, Property 18, Property 19)
    - **Property 16: Date modification is rejected for non-PENDING bookings**
    - **Property 17: Date modification is rejected for non-tenant users**
    - **Property 18: Successful date modification always updates booking and availability**
    - **Property 19: Successful date modification always notifies the owner**
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.8, 10.9**

- [x] 5. Checkpoint — ensure all BookingService tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. PaymentService improvements
  - [x] 6.1 Update `PaymentService.convertCurrency()` to use `ExchangeRateClient`
    - Replace the static `exchangeRates` map with a call to `ExchangeRateClient.getRates()`
    - Short-circuit and return `amount` unchanged when `from === to` (before calling `getRates()`)
    - _Requirements: 9.8, 9.9_

  - [ ]* 6.2 Write property test for currency conversion (Property 15)
    - **Property 15: Currency identity conversion**
    - **Validates: Requirements 9.9**

  - [x] 6.3 Update `PaymentService.refundPayment()` signature to accept `bookingId` instead of `paymentId`
    - Change lookup to `prisma.payment.findUnique({ where: { bookingId } })` so `BookingService.cancel()` can call it without knowing the payment ID
    - Update `status` to `'REFUNDED'` and set `refundedAt: new Date()`
    - _Requirements: 8.1, 8.2_

  - [x] 6.4 Add `PAYMENT_FAILED` notification in `initiateMoMoPayment`, `confirmMoMoPayment`, `initiateCardPayment`, and `confirmCardPayment` on failure paths
    - Import `NotificationService`; in each catch/error branch, call `NotificationService.create(booking.tenantId, 'PAYMENT_FAILED', ...)`
    - _Requirements: 13.2_

  - [ ]* 6.5 Write property test for payment failure notification (Property 25)
    - **Property 25: Payment failure always triggers PAYMENT_FAILED notification**
    - **Validates: Requirements 13.2**

- [x] 7. DisputeService improvements
  - [x] 7.1 Update `DisputeService.resolveDispute()` to send `DISPUTE_RESOLVED` notifications
    - After updating the dispute record, call `NotificationService.create()` for `dispute.raisedBy` and `dispute.against` with type `DISPUTE_RESOLVED`
    - _Requirements: 13.4_

  - [ ]* 7.2 Write property test for dispute resolution notification (Property 26)
    - **Property 26: Dispute resolution always notifies both parties**
    - **Validates: Requirements 13.4**

- [x] 8. Booking routes improvements
  - [x] 8.1 Apply Zod validation middleware and update existing routes in `backend/src/routes/booking.routes.ts`
    - Import `zodValidate` from `../middleware/zodValidate` and all four schemas from `../schemas/booking.schemas`
    - `POST /`: add `zodValidate(createBookingSchema)` before the handler; pass `promoCode: req.body.promoCode` to `BookingService.create()`
    - `GET /:id`: update handler to pass `req.user!.id` and `req.user!.role` to `BookingService.getById()`; return `403` when the service throws "Not authorized"
    - `PATCH /:id/tx`: add `zodValidate(txSchema)` before the handler; remove the manual `!txHash` check (now handled by Zod)
    - `PATCH /:id/dispute`: add `zodValidate(disputeSchema)` before the handler; pass `req.body.reason` and `req.body.againstUserId` to `BookingService.dispute()`
    - _Requirements: 14.1, 14.3, 14.7, 11.4, 15.3, 15.4, 5.1_

  - [x] 8.2 Add `PATCH /:id/dates` route to `backend/src/routes/booking.routes.ts`
    - Protect with `authenticate`; apply `zodValidate(modifyDatesSchema)`
    - Call `BookingService.modifyDates(parseInt(req.params.id), req.user!.id, req.body)`
    - Return `400` on service errors
    - _Requirements: 10.10, 14.5, 14.6_

- [x] 9. BookingTimeoutWorker cron job
  - [x] 9.1 Create `backend/src/workers/bookingTimeout.worker.ts`
    - Import `node-cron`, `BookingService`, `NotificationService`, `prisma`
    - Implement `cancelExpiredBookings()`: query `PENDING`/`LOCKED` bookings where `timeoutAt <= new Date()`; for each, call `BookingService.cancel(booking.id, 0, 'ADMIN')` then `NotificationService.create(booking.tenantId, 'BOOKING_TIMEOUT', ...)`; return `{ cancelled: count }`
    - Implement `sendTimeoutWarnings()`: query `LOCKED` bookings where `timeoutAt` is between `now` and `now + 72h`; for each, call `NotificationService.create(booking.tenantId, 'TIMEOUT_WARNING', ..., { bookingId, timeoutAt })`; return `{ warned: count }`
    - Export `BookingTimeoutWorker` class with `start()` registering two cron schedules: `*/15 * * * *` for `cancelExpiredBookings` and `0 9 * * *` (Africa/Kigali timezone) for `sendTimeoutWarnings`; and `stop()` to destroy them
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 13.3_

  - [x] 9.2 Register the worker in `backend/src/index.ts`
    - Import `BookingTimeoutWorker` and call `BookingTimeoutWorker.start()` after the Express server starts listening
    - _Requirements: 3.1_

  - [ ]* 9.3 Write property tests for the timeout worker (Property 5, Property 6, Property 7)
    - **Property 5: Expired bookings are always cancelled by the worker**
    - **Property 6: Expired booking cancellation always triggers BOOKING_TIMEOUT notification**
    - **Property 7: Bookings expiring within 72 hours always receive TIMEOUT_WARNING**
    - **Validates: Requirements 3.3, 3.4, 3.6, 13.3**

- [x] 10. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (add as dev dependency if not present: `npm install --save-dev fast-check`)
- The `SYSTEM_USER_ID` used by the cron worker can be `0` — `BookingService.cancel()` already accepts `ADMIN` role bypass
- `CalendarService.blockDates()` requires an `ownerId` — fetch it from the property record already loaded in `BookingService.create()`
- `PaymentService.refundPayment()` signature change (task 6.3) requires updating the existing call in `PaymentService` itself and the new call in `BookingService.cancel()`
- All new notification types (`PAYMENT_FAILED`, `TIMEOUT_WARNING`, `DISPUTE_RESOLVED`) must be added to the Prisma schema (task 1) before they can be used in service code
