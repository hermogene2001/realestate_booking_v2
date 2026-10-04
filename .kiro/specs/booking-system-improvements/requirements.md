# Requirements Document

## Introduction

This document defines the requirements for 15 targeted improvements to the escrow-based booking system of a Rwanda-focused property rental platform. The platform supports Ethereum, MoMo, and Card payments with a booking lifecycle of `PENDING → LOCKED → COMPLETED | CANCELLED | DISPUTED | REFUNDED`. The improvements address critical gaps in validation, automation, security, and integration without restructuring the existing architecture.

The changes span `BookingService`, `PaymentService`, `DisputeService`, `booking.routes.ts`, and introduce a new cron-based timeout worker and a dynamic exchange rate client.

---

## Glossary

- **BookingService**: The service responsible for the full booking lifecycle, including creation, confirmation, cancellation, and dispute management.
- **PaymentService**: The service responsible for multi-currency payment processing, refunds, and currency conversion.
- **ExchangeRateClient**: A new module that fetches live ETH/USD and USD/RWF exchange rates with an in-memory cache.
- **BookingTimeoutWorker**: A new cron-based worker that auto-cancels expired bookings and sends timeout warnings.
- **CalendarService**: The existing service that manages property availability records.
- **CommissionService**: The existing service that calculates and records platform commissions on completed bookings.
- **DisputeService**: The existing service that manages booking disputes.
- **NotificationService**: The existing service that creates in-app notifications for users.
- **PromoCodeService**: The existing service that validates and applies promotional discount codes.
- **ZodValidator**: The Zod-based middleware applied to booking routes for input validation.
- **Tenant**: A user with role `TENANT` who creates and pays for bookings.
- **Owner**: A user with role `OWNER` who lists properties.
- **Admin**: A user with role `ADMIN` who has full system access.
- **PENDING**: Booking status after creation, before on-chain payment is confirmed.
- **LOCKED**: Booking status after escrow payment is confirmed on-chain.
- **COMPLETED**: Booking status after both tenant and owner confirm handover.
- **CANCELLED**: Booking status after cancellation by any authorized party or by the system.
- **DISPUTED**: Booking status after a party raises a formal dispute.
- **REFUNDED**: Booking status after a refund is issued.
- **escrowAmount**: The ETH amount locked in the smart contract for a booking.
- **timeoutAt**: The datetime after which a PENDING or LOCKED booking is automatically cancelled.
- **promoCode**: A discount code that reduces the deposit amount at booking creation.
- **discountApplied**: The ETH amount discounted from the deposit due to a promo code.

---

## Requirements

### Requirement 1: Date Validation

**User Story:** As a tenant, I want the system to reject invalid booking dates, so that I cannot accidentally create bookings in the past or with illogical date ranges.

#### Acceptance Criteria

1. WHEN a tenant submits a booking creation request with a `startDate` that is earlier than the current datetime, THE BookingService SHALL reject the request with the error "Start date cannot be in the past".
2. WHEN a tenant submits a booking creation request where `endDate` is not strictly after `startDate`, THE BookingService SHALL reject the request with the error "End date must be after start date".
3. WHEN a tenant submits a booking creation request where the duration between `startDate` and `endDate` is less than 1 day, THE BookingService SHALL reject the request with the error "Minimum booking duration is 1 day".
4. WHEN a tenant submits a booking creation request with a `startDate` on or after the current datetime and an `endDate` at least 1 day after `startDate`, THE BookingService SHALL proceed with booking creation.

---

### Requirement 2: Calendar Availability Check

**User Story:** As a tenant, I want the system to verify property availability before confirming my booking, so that I cannot book a property that is already reserved for my requested dates.

#### Acceptance Criteria

1. WHEN a tenant submits a booking creation request, THE BookingService SHALL query CalendarService to check whether the property has any `isBooked = true` availability records overlapping the requested date range before creating the booking record.
2. IF the CalendarService returns a conflict for the requested date range, THEN THE BookingService SHALL reject the request with the error "Property is not available for the selected dates".
3. WHEN a booking is successfully created, THE BookingService SHALL instruct CalendarService to create an availability record marked `isBooked = true` for the booking's date range.
4. WHEN a booking date modification is requested, THE BookingService SHALL query CalendarService to verify the new date range is available, excluding the booking's own existing availability record from the conflict check.

---

### Requirement 3: Booking Timeout Enforcement

**User Story:** As a platform administrator, I want expired bookings to be automatically cancelled, so that properties are not indefinitely blocked by inactive bookings.

#### Acceptance Criteria

1. THE BookingTimeoutWorker SHALL run on a schedule every 15 minutes to detect and cancel expired bookings.
2. WHEN the BookingTimeoutWorker runs, THE BookingTimeoutWorker SHALL query the database for all bookings with status `PENDING` or `LOCKED` where `timeoutAt` is less than or equal to the current datetime.
3. WHEN the BookingTimeoutWorker identifies an expired booking, THE BookingTimeoutWorker SHALL invoke `BookingService.cancel()` for that booking using a system actor with `ADMIN` role, so that property status reset and refund logic are applied consistently.
4. WHEN the BookingTimeoutWorker cancels an expired booking, THE BookingTimeoutWorker SHALL send a `BOOKING_TIMEOUT` notification to the booking's tenant.
5. THE BookingTimeoutWorker SHALL run a daily schedule at 09:00 Africa/Kigali time to identify LOCKED bookings whose `timeoutAt` is within 72 hours of the current datetime.
6. WHEN the BookingTimeoutWorker identifies a booking expiring within 72 hours, THE BookingTimeoutWorker SHALL send a `TIMEOUT_WARNING` notification to the booking's tenant.

---

### Requirement 4: Property Status Reset

**User Story:** As a property owner, I want my property's status to automatically return to AVAILABLE after a booking ends or is cancelled, so that the property can accept new bookings without manual intervention.

#### Acceptance Criteria

1. WHEN a booking transitions to status `COMPLETED`, THE BookingService SHALL update the associated property's status to `AVAILABLE`.
2. WHEN a booking transitions to status `CANCELLED`, THE BookingService SHALL update the associated property's status to `AVAILABLE`.
3. WHILE a booking has status `PENDING` or `LOCKED`, THE BookingService SHALL NOT update the property status to `AVAILABLE`.

---

### Requirement 5: Authorization on Booking Detail

**User Story:** As a platform user, I want booking details to be accessible only to authorized parties, so that tenants cannot view other users' private booking information.

#### Acceptance Criteria

1. WHEN a user requests booking details via `getById`, THE BookingService SHALL verify that the requesting user is the booking's tenant, the property owner, or has the `ADMIN` role before returning the booking record.
2. IF the requesting user is not the booking's tenant, the property owner, or an Admin, THEN THE BookingService SHALL reject the request with a 403 error and the message "Not authorized to view this booking".
3. WHEN the requesting user is the booking's tenant, THE BookingService SHALL return the full booking record including property, tenant, transactions, and review.
4. WHEN the requesting user is the property owner, THE BookingService SHALL return the full booking record including property, tenant, transactions, and review.
5. WHEN the requesting user has the `ADMIN` role, THE BookingService SHALL return the full booking record including property, tenant, transactions, and review.

---

### Requirement 6: Auto-Commission on Booking Completion

**User Story:** As a platform administrator, I want a commission record to be automatically created when a booking completes, so that platform revenue is tracked without manual intervention.

#### Acceptance Criteria

1. WHEN a booking transitions to status `COMPLETED` (both tenant and owner have confirmed handover), THE BookingService SHALL invoke `CommissionService.createCommission()` with the booking ID.
2. IF `CommissionService.createCommission()` throws an error (e.g., commission already exists), THEN THE BookingService SHALL log the error and allow the booking to remain in `COMPLETED` status without propagating the error to the caller.
3. WHEN `CommissionService.createCommission()` succeeds, THE CommissionService SHALL create a commission record with `platformFee`, `ownerReceives`, `totalAmount`, and `commissionRate` calculated from the booking's `escrowAmount`.

---

### Requirement 7: Payment Amount Validation

**User Story:** As a platform operator, I want the system to validate that the payment amount matches the property's required deposit, so that bookings are not created with incorrect payment values.

#### Acceptance Criteria

1. WHEN a booking creation request is received, THE BookingService SHALL verify that the payment amount provided is consistent with the property's `depositEth` value.
2. IF the payment amount does not match the property's required deposit after any applicable promo code discount, THEN THE BookingService SHALL reject the request with an appropriate error message.
3. WHERE a promo code is applied, THE BookingService SHALL use the discounted deposit amount as the validated payment amount.

---

### Requirement 8: Cancellation Refund Logic

**User Story:** As a tenant, I want my escrow payment to be refunded when a LOCKED booking is cancelled, so that I do not lose funds when a booking does not proceed.

#### Acceptance Criteria

1. WHEN a booking with status `LOCKED` is cancelled and the booking has an associated payment record, THE BookingService SHALL invoke `PaymentService.refundPayment()` before updating the booking status to `CANCELLED`.
2. WHEN `PaymentService.refundPayment()` is invoked for a LOCKED booking cancellation, THE PaymentService SHALL update the payment record's status to `REFUNDED` and set `refundedAt` to the current datetime.
3. WHEN a booking with status `PENDING` is cancelled, THE BookingService SHALL NOT invoke `PaymentService.refundPayment()` as no payment has been confirmed.
4. WHEN a refund is processed for a cancelled LOCKED booking, THE BookingService SHALL send a `REFUND_ISSUED` notification to the tenant.

---

### Requirement 9: Dynamic Exchange Rates

**User Story:** As a tenant, I want currency conversions to use live exchange rates, so that the displayed amounts in RWF and USD accurately reflect current market values.

#### Acceptance Criteria

1. THE ExchangeRateClient SHALL fetch the ETH/USD rate from the CoinGecko API endpoint `/simple/price?ids=ethereum&vs_currencies=usd`.
2. THE ExchangeRateClient SHALL fetch the USD/RWF rate from the ExchangeRate-API endpoint `/v6/{key}/pair/USD/RWF`.
3. THE ExchangeRateClient SHALL cache fetched rates in memory with a time-to-live of 5 minutes.
4. WHILE cached rates are less than 5 minutes old, THE ExchangeRateClient SHALL return the cached rates without making external API calls.
5. WHEN the cache has expired, THE ExchangeRateClient SHALL fetch fresh rates from the external APIs before returning.
6. IF an external API call fails, THEN THE ExchangeRateClient SHALL log a warning and return the last successfully cached rates.
7. IF an external API call fails and no cached rates exist, THEN THE ExchangeRateClient SHALL return hardcoded fallback rates and log a warning.
8. THE PaymentService SHALL use `ExchangeRateClient.getRates()` instead of the static `exchangeRates` map for all currency conversions.
9. WHEN `PaymentService.convertCurrency()` is called with identical `from` and `to` currency codes, THE PaymentService SHALL return the input amount unchanged without calling ExchangeRateClient.

---

### Requirement 10: Booking Date Modification

**User Story:** As a tenant, I want to modify the dates of a PENDING booking, so that I can adjust my reservation without cancelling and re-creating it.

#### Acceptance Criteria

1. THE BookingService SHALL expose a `modifyDates(id, userId, data)` method that accepts a booking ID, the requesting user's ID, and new `startDate` and `endDate` values.
2. WHEN a date modification request is received, THE BookingService SHALL verify that the booking exists and has status `PENDING`.
3. IF the booking does not have status `PENDING`, THEN THE BookingService SHALL reject the modification with an appropriate error message.
4. WHEN a date modification request is received, THE BookingService SHALL verify that the requesting user is the booking's tenant.
5. IF the requesting user is not the booking's tenant, THEN THE BookingService SHALL reject the modification with an authorization error.
6. WHEN a date modification request passes authorization, THE BookingService SHALL apply the same date validation rules as booking creation (no past dates, endDate > startDate, minimum 1 day).
7. WHEN a date modification request passes date validation, THE BookingService SHALL check calendar availability for the new date range, excluding the booking's own existing availability record.
8. WHEN a date modification is approved, THE BookingService SHALL update `booking.startDate`, `booking.endDate`, and the associated availability record to reflect the new dates.
9. WHEN a date modification is successfully applied, THE BookingService SHALL send a notification to the property owner indicating the dates have changed.
10. THE booking.routes.ts SHALL expose a `PATCH /:id/dates` endpoint protected by authentication that accepts `startDate` and `endDate` validated by the `modifyDatesSchema` Zod schema.

---

### Requirement 11: Enhanced Dispute Submission

**User Story:** As a booking party, I want to submit a dispute with a meaningful reason, so that administrators have sufficient context to resolve the dispute fairly.

#### Acceptance Criteria

1. WHEN a dispute is raised via `BookingService.dispute()`, THE BookingService SHALL accept a `reason` string parameter and pass it to `DisputeService.raiseDispute()`.
2. WHEN a dispute reason is provided, THE BookingService SHALL validate that the reason string contains at least 20 characters.
3. IF the dispute reason contains fewer than 20 characters, THEN THE BookingService SHALL reject the request with the error "Dispute reason must be at least 20 characters".
4. THE booking.routes.ts dispute endpoint SHALL extract the `reason` and `againstUserId` fields from the request body and pass them to `BookingService.dispute()`.
5. THE ZodValidator SHALL validate the dispute request body using the `disputeSchema`, requiring `reason` to be a string of at least 20 characters and `againstUserId` to be a positive integer.

---

### Requirement 12: Promo Code Integration at Booking Creation

**User Story:** As a tenant, I want to apply a promo code when creating a booking, so that I can receive a discount on the required deposit amount.

#### Acceptance Criteria

1. WHEN a booking creation request includes a `promoCode` field, THE BookingService SHALL invoke `PromoCodeService.applyPromo()` to validate and apply the discount.
2. WHEN `PromoCodeService.applyPromo()` is invoked, THE PromoCodeService SHALL verify that the promo code exists, `isActive` is `true`, the current datetime is between `validFrom` and `validUntil`, and `usedCount` is less than `maxUses` (when `maxUses > 0`).
3. IF the promo code is invalid, inactive, expired, or exhausted, THEN THE PromoCodeService SHALL throw an appropriate error and THE BookingService SHALL reject the booking creation request.
4. WHEN a valid promo code is applied, THE PromoCodeService SHALL calculate the discounted deposit amount and return `discountedAmount`, `discountApplied`, and `promoCodeId`.
5. WHEN a promo code discount is applied, THE PromoCodeService SHALL increment the promo code's `usedCount` atomically within the same transaction as the booking creation.
6. WHEN a booking is created with a promo code, THE BookingService SHALL store `promoCodeId` and `discountApplied` on the booking record.
7. WHEN a booking is created with a promo code, THE BookingService SHALL return `contractParams.depositAmount` as the discounted amount and `contractParams.originalDepositAmount` as the property's original `depositEth`.
8. WHEN a booking creation request does not include a `promoCode` field, THE BookingService SHALL proceed with the full property `depositEth` as the deposit amount and set `discountApplied` to `0`.
9. THE PromoCodeService SHALL ensure that the discounted deposit amount is never less than `0`.

---

### Requirement 13: Enhanced Notifications

**User Story:** As a platform user, I want to receive notifications for payment failures, upcoming booking timeouts, and dispute resolutions, so that I can take timely action on my bookings.

#### Acceptance Criteria

1. THE NotificationType enum in the Prisma schema SHALL include the values `PAYMENT_FAILED`, `TIMEOUT_WARNING`, and `DISPUTE_RESOLVED`.
2. WHEN a payment attempt fails for a booking, THE PaymentService SHALL send a `PAYMENT_FAILED` notification to the booking's tenant.
3. WHEN the BookingTimeoutWorker identifies a LOCKED booking expiring within 72 hours, THE BookingTimeoutWorker SHALL send a `TIMEOUT_WARNING` notification to the booking's tenant including the booking ID and `timeoutAt` datetime in the notification metadata.
4. WHEN an admin resolves a dispute, THE DisputeService SHALL send a `DISPUTE_RESOLVED` notification to both the user who raised the dispute and the user the dispute was raised against.

---

### Requirement 14: Zod Input Validation on Booking Routes

**User Story:** As a platform operator, I want all booking route inputs to be validated before reaching the service layer, so that malformed requests are rejected early with clear error messages.

#### Acceptance Criteria

1. THE booking.routes.ts SHALL apply Zod validation middleware to the `POST /` (create booking) route using the `createBookingSchema`.
2. THE `createBookingSchema` SHALL require `propertyId` as a positive integer, `startDate` as an ISO 8601 datetime string, `endDate` as an ISO 8601 datetime string, and allow an optional `promoCode` string.
3. THE booking.routes.ts SHALL apply Zod validation middleware to the `PATCH /:id/tx` route using the `txSchema`.
4. THE `txSchema` SHALL require `txHash` as a non-empty string and `escrowAmount` as a string representing a positive non-zero numeric value.
5. THE booking.routes.ts SHALL apply Zod validation middleware to the `PATCH /:id/dates` route using the `modifyDatesSchema`.
6. THE `modifyDatesSchema` SHALL require `startDate` and `endDate` as ISO 8601 datetime strings.
7. THE booking.routes.ts SHALL apply Zod validation middleware to the `PATCH /:id/dispute` route using the `disputeSchema`.
8. THE `disputeSchema` SHALL require `reason` as a string of at least 20 characters and `againstUserId` as a positive integer.
9. IF a request body fails Zod schema validation, THEN THE ZodValidator SHALL return a `400 Bad Request` response with a structured error message before the request reaches the service layer.

---

### Requirement 15: Escrow Amount Guard on Transaction Endpoint

**User Story:** As a platform operator, I want the transaction recording endpoint to reject zero or missing escrow amounts, so that invalid on-chain deposit records are never created.

#### Acceptance Criteria

1. WHEN a `PATCH /:id/tx` request is received, THE ZodValidator SHALL validate that `escrowAmount` is present in the request body.
2. WHEN a `PATCH /:id/tx` request is received, THE ZodValidator SHALL validate that `escrowAmount` is not the string `'0'` and that its numeric value is greater than `0`.
3. IF `escrowAmount` is absent, equal to `'0'`, or has a numeric value of `0` or less, THEN THE ZodValidator SHALL return a `400 Bad Request` response with the error "escrowAmount must be a positive non-zero value" before the request reaches BookingService.
4. WHEN `escrowAmount` passes validation, THE BookingService SHALL store the validated `escrowAmount` on the booking record and proceed to create the transaction record.
