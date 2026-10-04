# Design Document: Booking Modifications & Flexibility

## Overview

This design implements a comprehensive booking modification system that extends the existing booking platform with support for flexible modifications (dates, guest count, add-on services), configurable cancellation policies (strict, moderate, flexible), and intelligent refund calculations. The system enforces policy-based constraints, maintains audit trails, and provides real-time notifications to both tenants and owners.

The architecture separates concerns into distinct layers:
- **Data Layer**: Extended Prisma models for modifications, add-ons, policies, and audit trails
- **Business Logic Layer**: Services for modification workflows, refund calculations, and policy enforcement
- **API Layer**: RESTful endpoints for modification requests, cancellations, and policy management
- **Notification Layer**: Event-driven notifications for all state changes

## Architecture

### High-Level Flow

```
Tenant Request → Validation → Modification Request Created → Owner Notification
                                                                    ↓
                                                            Owner Approval/Rejection
                                                                    ↓
                                                    Booking Updated / Request Rejected
                                                                    ↓
                                                    Tenant Notification + Audit Log
```

### Cancellation Flow

```
Cancellation Request → Policy Lookup → Refund Calculation → Display to Tenant
                                                                    ↓
                                                            Tenant Confirmation
                                                                    ↓
                                                    Refund Transaction Created
                                                                    ↓
                                                    Booking Status Updated
                                                                    ↓
                                                    Notifications Sent + Audit Log
```

### Add-on Service Flow

```
Owner Configures Service → Service Stored with Constraints
                                    ↓
                        Tenant Requests Add-on
                                    ↓
                        Availability Validation
                                    ↓
                        Capacity Check (if limited)
                                    ↓
                        Add-on Added to Booking
                                    ↓
                        Price Recalculated
```

## Components and Interfaces

### 1. Data Models (Prisma Schema Extensions)

#### CancellationPolicy Model
```typescript
model CancellationPolicy {
  id                    Int       @id @default(autoincrement())
  propertyId            Int       @map("property_id")
  policyType            String    // STRICT, MODERATE, FLEXIBLE
  
  // Refund percentages for each tier
  refundPercentage1     Int       // First tier refund %
  refundPercentage2     Int       // Second tier refund %
  refundPercentage3     Int       // Third tier refund %
  
  // Days before check-in for each tier
  daysBeforeCheckIn1    Int       // Days for first tier
  daysBeforeCheckIn2    Int       // Days for second tier
  
  isActive              Boolean   @default(true)
  appliedAt             DateTime  @map("applied_at")
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  property              Property  @relation(fields: [propertyId], references: [id])
  bookings              Booking[] @relation("BookingPolicy")
  
  @@index([propertyId])
  @@index([policyType])
  @@map("cancellation_policies")
}
```

#### AddOnService Model
```typescript
model AddOnService {
  id                    Int       @id @default(autoincrement())
  propertyId            Int       @map("property_id")
  serviceType           String    // CLEANING, LAUNDRY, TOURS
  pricePerUnit          Float     @map("price_per_unit")
  description           String?   @db.Text
  
  // Availability constraints
  availableFrom         DateTime? @map("available_from")
  availableUntil        DateTime? @map("available_until")
  availableDaysOfWeek   Json?     @map("available_days_of_week") // [0-6] for Sun-Sat
  
  // Capacity management
  maxCapacity           Int?      @map("max_capacity")
  currentCapacity       Int       @default(0) @map("current_capacity")
  
  isActive              Boolean   @default(true)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  property              Property  @relation(fields: [propertyId], references: [id])
  bookingAddOns         BookingAddOn[]
  
  @@index([propertyId])
  @@index([serviceType])
  @@map("add_on_services")
}
```

#### BookingAddOn Model
```typescript
model BookingAddOn {
  id                    Int       @id @default(autoincrement())
  bookingId             Int       @map("booking_id")
  addOnServiceId        Int       @map("add_on_service_id")
  quantity              Int       @default(1)
  priceAtBooking        Float     @map("price_at_booking")
  totalPrice            Float     @map("total_price")
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  booking               Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  addOnService          AddOnService @relation(fields: [addOnServiceId], references: [id])
  
  @@unique([bookingId, addOnServiceId])
  @@index([bookingId])
  @@map("booking_add_ons")
}
```

#### BookingModification Model
```typescript
model BookingModification {
  id                    Int       @id @default(autoincrement())
  bookingId             Int       @map("booking_id")
  requestedBy           Int       @map("requested_by")
  
  // Modification details
  modificationType      String    // DATES, GUEST_COUNT, ADD_ONS, MULTIPLE
  oldStartDate          DateTime? @map("old_start_date")
  newStartDate          DateTime? @map("new_start_date")
  oldEndDate            DateTime? @map("old_end_date")
  newEndDate            DateTime? @map("new_end_date")
  oldGuestCount         Int?      @map("old_guest_count")
  newGuestCount         Int?      @map("new_guest_count")
  
  // Pricing
  oldPrice              Float     @map("old_price")
  newPrice              Float     @map("new_price")
  priceDifference       Float     @map("price_difference")
  
  // Status and workflow
  status                String    @default("PENDING") // PENDING, APPROVED, REJECTED, EXPIRED
  reason                String?   @db.Text
  rejectionReason       String?   @map("rejection_reason") @db.Text
  
  // Approval workflow
  approvedBy            Int?      @map("approved_by")
  approvedAt            DateTime? @map("approved_at")
  rejectedAt            DateTime? @map("rejected_at")
  expiresAt             DateTime  @map("expires_at")
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  booking               Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  requester             User      @relation("ModificationRequester", fields: [requestedBy], references: [id])
  approver              User?     @relation("ModificationApprover", fields: [approvedBy], references: [id])
  
  @@index([bookingId])
  @@index([status])
  @@index([expiresAt])
  @@map("booking_modifications")
}
```

#### RefundTransaction Model
```typescript
model RefundTransaction {
  id                    Int       @id @default(autoincrement())
  bookingId             Int       @map("booking_id")
  cancellationPolicyId  Int       @map("cancellation_policy_id")
  
  // Refund calculation details
  baseAmount            Float     @map("base_amount")
  addOnAmount           Float     @default(0) @map("add_on_amount")
  totalAmount           Float     @map("total_amount")
  refundPercentage      Int       @map("refund_percentage")
  refundAmount          Float     @map("refund_amount")
  
  // Cancellation details
  cancellationReason    String?   @map("cancellation_reason") @db.Text
  cancellationDate      DateTime  @map("cancellation_date")
  checkInDate           DateTime  @map("check_in_date")
  daysBeforeCheckIn     Int       @map("days_before_check_in")
  
  // Status
  status                String    @default("PENDING") // PENDING, PROCESSED, FAILED
  processedAt           DateTime? @map("processed_at")
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  booking               Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  policy                CancellationPolicy @relation(fields: [cancellationPolicyId], references: [id])
  
  @@index([bookingId])
  @@index([status])
  @@map("refund_transactions")
}
```

#### AuditLog Model
```typescript
model AuditLog {
  id                    Int       @id @default(autoincrement())
  bookingId             Int       @map("booking_id")
  action                String    // MODIFICATION_REQUESTED, MODIFICATION_APPROVED, MODIFICATION_REJECTED, CANCELLATION_REQUESTED, REFUND_PROCESSED
  
  // Actor information
  actorId               Int       @map("actor_id")
  actorRole             String    // TENANT, OWNER, ADMIN
  
  // Change details
  oldValues             Json?     @map("old_values")
  newValues             Json?     @map("new_values")
  metadata              Json?     @default("{}")
  
  createdAt             DateTime  @default(now())
  
  booking               Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  actor                 User      @relation(fields: [actorId], references: [id])
  
  @@index([bookingId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 2. Service Layer

#### ModificationService
```typescript
interface ModificationRequest {
  bookingId: number;
  modificationType: 'DATES' | 'GUEST_COUNT' | 'ADD_ONS' | 'MULTIPLE';
  newStartDate?: Date;
  newEndDate?: Date;
  newGuestCount?: number;
  reason?: string;
}

interface ModificationResponse {
  modificationId: number;
  status: 'PENDING';
  oldPrice: number;
  newPrice: number;
  priceDifference: number;
  expiresAt: Date;
}

class ModificationService {
  // Request a modification
  static async requestModification(
    tenantId: number,
    request: ModificationRequest
  ): Promise<ModificationResponse>
  
  // Validate modification against constraints
  static async validateModification(
    bookingId: number,
    modification: ModificationRequest
  ): Promise<{ valid: boolean; errors: string[] }>
  
  // Approve modification (owner)
  static async approveModification(
    modificationId: number,
    ownerId: number
  ): Promise<Booking>
  
  // Reject modification (owner)
  static async rejectModification(
    modificationId: number,
    ownerId: number,
    reason: string
  ): Promise<void>
  
  // Check and expire old requests
  static async expireOldRequests(): Promise<number>
  
  // Get modification history
  static async getModificationHistory(bookingId: number): Promise<BookingModification[]>
}
```

#### CancellationPolicyService
```typescript
interface PolicyConfig {
  policyType: 'STRICT' | 'MODERATE' | 'FLEXIBLE';
}

interface RefundCalculation {
  refundPercentage: number;
  refundAmount: number;
  tier: number;
  reason: string;
}

class CancellationPolicyService {
  // Set policy for property
  static async setPolicy(
    propertyId: number,
    ownerId: number,
    config: PolicyConfig
  ): Promise<CancellationPolicy>
  
  // Get policy for property
  static async getPolicy(propertyId: number): Promise<CancellationPolicy>
  
  // Calculate refund for cancellation
  static async calculateRefund(
    bookingId: number,
    cancellationDate: Date
  ): Promise<RefundCalculation>
  
  // Get policy details
  static getPolicyDetails(policyType: string): {
    tier1: { days: number; percentage: number };
    tier2: { days: number; percentage: number };
    tier3: { days: number; percentage: number };
  }
}
```

#### AddOnService
```typescript
interface AddOnConfig {
  serviceType: 'CLEANING' | 'LAUNDRY' | 'TOURS';
  pricePerUnit: number;
  description?: string;
  availableFrom?: Date;
  availableUntil?: Date;
  availableDaysOfWeek?: number[];
  maxCapacity?: number;
}

interface AddOnRequest {
  addOnServiceId: number;
  quantity: number;
  bookingDates: { startDate: Date; endDate: Date };
}

class AddOnServiceManager {
  // Configure add-on service
  static async configureService(
    propertyId: number,
    ownerId: number,
    config: AddOnConfig
  ): Promise<AddOnService>
  
  // Add service to booking
  static async addServiceToBooking(
    bookingId: number,
    request: AddOnRequest
  ): Promise<BookingAddOn>
  
  // Remove service from booking
  static async removeServiceFromBooking(
    bookingId: number,
    addOnServiceId: number
  ): Promise<void>
  
  // Validate service availability
  static async validateAvailability(
    addOnServiceId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ available: boolean; reason?: string }>
  
  // Check capacity
  static async checkCapacity(
    addOnServiceId: number,
    quantity: number
  ): Promise<boolean>
  
  // Release capacity on cancellation
  static async releaseCapacity(
    bookingId: number
  ): Promise<void>
}
```

#### CancellationService
```typescript
interface CancellationRequest {
  bookingId: number;
  reason?: string;
}

interface CancellationResponse {
  bookingId: number;
  refundAmount: number;
  refundPercentage: number;
  status: string;
  processedAt: Date;
}

class CancellationService {
  // Request cancellation (returns refund preview)
  static async previewCancellation(
    bookingId: number,
    tenantId: number
  ): Promise<{ refundAmount: number; refundPercentage: number }>
  
  // Process cancellation
  static async processCancellation(
    bookingId: number,
    tenantId: number,
    request: CancellationRequest
  ): Promise<CancellationResponse>
  
  // Validate cancellation against policy
  static async validateCancellation(
    bookingId: number
  ): Promise<{ allowed: boolean; reason?: string }>
}
```

### 3. API Endpoints

#### Modification Endpoints
```
POST   /api/bookings/:id/modifications
       Request a modification
       Body: { modificationType, newStartDate?, newEndDate?, newGuestCount?, reason? }
       Response: { modificationId, status, oldPrice, newPrice, priceDifference, expiresAt }

GET    /api/bookings/:id/modifications
       Get modification history
       Response: { modifications: BookingModification[] }

PATCH  /api/modifications/:id/approve
       Owner approves modification
       Response: { booking: Booking }

PATCH  /api/modifications/:id/reject
       Owner rejects modification
       Body: { reason }
       Response: { status: 'REJECTED' }
```

#### Cancellation Policy Endpoints
```
POST   /api/properties/:id/cancellation-policy
       Set cancellation policy
       Body: { policyType: 'STRICT' | 'MODERATE' | 'FLEXIBLE' }
       Response: { policy: CancellationPolicy }

GET    /api/properties/:id/cancellation-policy
       Get property's cancellation policy
       Response: { policy: CancellationPolicy }
```

#### Add-on Service Endpoints
```
POST   /api/properties/:id/add-on-services
       Configure add-on service
       Body: { serviceType, pricePerUnit, description?, availableFrom?, availableUntil?, maxCapacity? }
       Response: { service: AddOnService }

GET    /api/properties/:id/add-on-services
       Get property's add-on services
       Response: { services: AddOnService[] }

POST   /api/bookings/:id/add-ons
       Add service to booking
       Body: { addOnServiceId, quantity }
       Response: { addOn: BookingAddOn, newTotal: number }

DELETE /api/bookings/:id/add-ons/:addOnId
       Remove service from booking
       Response: { newTotal: number }
```

#### Cancellation Endpoints
```
GET    /api/bookings/:id/cancellation-preview
       Preview refund amount
       Response: { refundAmount, refundPercentage, policy }

POST   /api/bookings/:id/cancel
       Process cancellation
       Body: { reason? }
       Response: { refundAmount, status, processedAt }
```

## Data Models

### Booking Model Extensions
The existing Booking model will be extended with:
```typescript
model Booking {
  // ... existing fields ...
  
  // New fields for this feature
  guestCount            Int       @default(1) @map("guest_count")
  cancellationPolicyId  Int?      @map("cancellation_policy_id")
  totalPrice            Float     @map("total_price") // Including add-ons
  basePrice             Float     @map("base_price") // Excluding add-ons
  
  // Relations
  cancellationPolicy    CancellationPolicy? @relation("BookingPolicy", fields: [cancellationPolicyId], references: [id])
  addOns                BookingAddOn[]
  modifications         BookingModification[]
  refundTransactions    RefundTransaction[]
  auditLogs             AuditLog[]
}
```

### Property Model Extensions
```typescript
model Property {
  // ... existing fields ...
  
  // New relations
  cancellationPolicies  CancellationPolicy[]
  addOnServices         AddOnService[]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Modification Request Creation

*For any* valid booking and modification request, creating a modification request SHALL result in a PENDING status record with an expiration time 48 hours in the future.

**Validates: Requirements 1.5, 5.1**

### Property 2: Modification Conflict Detection

*For any* property with existing bookings and a new modification request with overlapping dates, the system SHALL detect the conflict and reject the modification.

**Validates: Requirements 1.2**

### Property 3: Price Recalculation on Date Modification

*For any* booking with a date modification, the new price SHALL be recalculated based on the nightly rate and new date range, maintaining consistency with the property's pricing rules.

**Validates: Requirements 1.3, 7.1**

### Property 4: Guest Count Capacity Validation

*For any* booking modification that increases guest count, the system SHALL validate that the new guest count does not exceed the property's capacity.

**Validates: Requirements 1.4**

### Property 5: Add-on Service Round-trip

*For any* add-on service configured with specific attributes (type, price, description, availability), storing and retrieving the service SHALL preserve all attributes exactly.

**Validates: Requirements 2.2**

### Property 6: Add-on Cost Addition

*For any* booking and add-on service, adding the service to the booking SHALL increase the total price by exactly the service cost.

**Validates: Requirements 2.3**

### Property 7: Cumulative Add-on Costs

*For any* booking with multiple add-on services, the total price SHALL equal the base price plus the sum of all add-on costs.

**Validates: Requirements 2.4**

### Property 8: Add-on Removal Idempotence

*For any* booking with an add-on service, adding then removing the service SHALL return the booking to its original price.

**Validates: Requirements 2.5**

### Property 9: Strict Policy Refund Calculation

*For any* booking with a strict cancellation policy and cancellation date, the refund percentage SHALL match the policy's tier based on days before check-in (100% if 30+ days, 50% if 7-29 days, 0% if <7 days).

**Validates: Requirements 3.2**

### Property 10: Moderate Policy Refund Calculation

*For any* booking with a moderate cancellation policy and cancellation date, the refund percentage SHALL match the policy's tier based on days before check-in (100% if 14+ days, 75% if 7-13 days, 25% if <7 days).

**Validates: Requirements 3.3**

### Property 11: Flexible Policy Refund Calculation

*For any* booking with a flexible cancellation policy and cancellation date, the refund percentage SHALL match the policy's tier based on days before check-in (100% if 7+ days, 50% if 1-6 days, 0% if on/after check-in).

**Validates: Requirements 3.4**

### Property 12: Policy Assignment on Booking Creation

*For any* new booking created for a property, the booking SHALL be assigned the property's current active cancellation policy.

**Validates: Requirements 3.6**

### Property 13: Refund Calculation Consistency

*For any* booking with add-ons and a cancellation request, the refund percentage SHALL apply uniformly to both base price and add-on costs.

**Validates: Requirements 4.3**

### Property 14: Modification Approval Updates Booking

*For any* approved modification request, the booking's parameters (dates, guest count, price) SHALL be updated to match the modification request.

**Validates: Requirements 5.2**

### Property 15: Modification Rejection Preserves Booking

*For any* rejected modification request, the original booking parameters SHALL remain unchanged.

**Validates: Requirements 5.3**

### Property 16: Policy Isolation on Change

*For any* property where the cancellation policy is changed, existing bookings SHALL retain their original policy, and only new bookings SHALL receive the new policy.

**Validates: Requirements 6.6**

### Property 17: Price Difference Calculation

*For any* booking modification, the price difference SHALL equal the new price minus the old price, and SHALL be positive for price increases and negative for price decreases.

**Validates: Requirements 7.3**

### Property 18: Add-on Availability Validation

*For any* add-on service with availability constraints and a booking request, the system SHALL validate that the booking dates fall within the service's availability window.

**Validates: Requirements 8.2**

### Property 19: Add-on Capacity Enforcement

*For any* add-on service with limited capacity and concurrent booking requests, the system SHALL prevent overbooking by enforcing the maximum capacity limit.

**Validates: Requirements 8.4, 8.5**

### Property 20: Capacity Release on Cancellation

*For any* booking with add-on services that is cancelled, the system SHALL release the add-on service capacity, making it available for other bookings.

**Validates: Requirements 8.6**

### Property 21: Audit Trail Completeness

*For any* booking modification, the audit log entry SHALL contain all required fields: modification type, old values, new values, timestamp, and requester.

**Validates: Requirements 9.1**

### Property 22: Audit Trail Immutability

*For any* refund transaction, the audit log entry SHALL be immutable and contain all refund calculation details.

**Validates: Requirements 9.5**

### Property 23: Modification History Retrieval

*For any* booking with multiple modifications, requesting the modification history SHALL return all modifications in chronological order with complete details.

**Validates: Requirements 9.6**

### Property 24: Modification Request Expiration

*For any* modification request that reaches its expiration time without approval or rejection, the system SHALL automatically set its status to EXPIRED.

**Validates: Requirements 5.6**

## Error Handling

### Modification Validation Errors
- **Conflict Detection**: If modification dates conflict with existing bookings, return 409 Conflict with details
- **Capacity Exceeded**: If guest count exceeds property capacity, return 400 Bad Request
- **Invalid Dates**: If new dates are in the past or invalid, return 400 Bad Request
- **Expired Request**: If modification request has expired, return 410 Gone

### Cancellation Errors
- **Policy Violation**: If cancellation violates policy constraints, return 403 Forbidden
- **Invalid Status**: If booking is not in a cancellable state, return 400 Bad Request
- **Locked Booking**: If booking is locked and outside cancellation window, return 403 Forbidden

### Add-on Service Errors
- **Service Unavailable**: If add-on service is unavailable for requested dates, return 400 Bad Request
- **Capacity Exceeded**: If add-on service capacity is exceeded, return 409 Conflict
- **Invalid Service**: If add-on service does not exist, return 404 Not Found

### Authorization Errors
- **Unauthorized Modification**: If tenant tries to modify another's booking, return 403 Forbidden
- **Unauthorized Approval**: If non-owner tries to approve modification, return 403 Forbidden
- **Unauthorized Cancellation**: If user tries to cancel another's booking, return 403 Forbidden

## Testing Strategy

### Property-Based Testing

This feature is highly suitable for property-based testing because:
1. **Pure Functions**: Refund calculations, price recalculations, and policy enforcement are deterministic functions
2. **Universal Properties**: Rules like "refund percentage must match policy tier" apply across all inputs
3. **Large Input Space**: Dates, guest counts, add-on combinations, and policies create a large input space
4. **Edge Cases**: Property-based testing will discover edge cases in date calculations and policy boundaries

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Each test references a design property
- Tag format: `Feature: booking-modifications-flexibility, Property {N}: {title}`

**Property Tests to Implement**:
- Property 1-24 as defined above
- Each property test uses appropriate generators for dates, prices, policies, and modifications
- Tests use mocks for external services (notifications, payments)

### Unit Tests

**Modification Service Tests**:
- Test modification request creation with valid/invalid inputs
- Test conflict detection with overlapping bookings
- Test modification approval and rejection workflows
- Test modification expiration logic
- Test modification history retrieval

**Cancellation Policy Tests**:
- Test policy creation and retrieval
- Test refund calculation for each policy type
- Test policy assignment to new bookings
- Test policy isolation when changed

**Add-on Service Tests**:
- Test add-on service configuration
- Test add-on addition and removal
- Test availability validation
- Test capacity management
- Test capacity release on cancellation

**Cancellation Service Tests**:
- Test cancellation preview
- Test cancellation processing
- Test refund transaction creation
- Test booking status updates

**Audit Log Tests**:
- Test audit log creation for all actions
- Test audit log retrieval
- Test audit log immutability

### Integration Tests

**End-to-End Modification Workflow**:
- Create booking → Request modification → Owner approves → Booking updated → Notifications sent
- Create booking → Request modification → Owner rejects → Booking unchanged → Notifications sent
- Create booking → Request modification → Request expires → Status updated → Notifications sent

**End-to-End Cancellation Workflow**:
- Create booking → Preview cancellation → Process cancellation → Refund created → Notifications sent
- Create booking with add-ons → Cancel → Refund includes add-ons → Capacity released

**Add-on Service Workflow**:
- Configure service → Add to booking → Verify price updated → Remove from booking → Verify price restored
- Configure service with capacity → Multiple bookings request → Verify capacity enforced → Cancel one → Verify capacity released

**Policy Enforcement**:
- Set strict policy → Create booking → Cancel at different times → Verify correct refund percentages
- Change policy → Verify old bookings keep old policy → Verify new bookings get new policy

### Smoke Tests

- Service initialization and database connectivity
- API endpoint availability
- Notification service integration
- Payment service integration

## Notes

- All timestamps use UTC
- Prices are stored as floats with 2 decimal precision
- Modification requests expire after 48 hours
- Refund calculations are performed at cancellation time, not at request time
- Audit logs are immutable and cannot be deleted
- Add-on service capacity is tracked per service, not per booking
- Notifications are sent asynchronously via event queue
- All modifications require owner approval before taking effect
- Cancellation policies apply only to future bookings when changed
