# Design Document: Instant Booking vs Request-Based Modes

## Overview

This design implements a dual booking mode system for the Rwanda-focused property rental platform. The feature allows property owners to choose between two booking confirmation strategies on a per-property basis:

1. **Instant Booking**: Automatically confirms bookings without owner intervention, providing immediate certainty to guests
2. **Request-Based Booking**: Maintains the current flow where bookings require explicit owner approval before confirmation

The implementation leverages the existing booking infrastructure while adding a new `bookingMode` field to the Property model and introducing conditional logic in the booking creation and approval workflows. The system maintains backward compatibility by defaulting all existing properties to Request-Based mode.

## Architecture

### High-Level Flow

```
Guest Initiates Booking
    ↓
System Retrieves Property & Booking Mode
    ↓
    ├─→ [Instant Mode] → Immediate Confirmation → Block Calendar → Send Notifications
    │
    └─→ [Request Mode] → Create Pending Booking → Notify Owner → Await Approval
                              ↓
                         Owner Reviews
                              ↓
                         ├─→ Approve → Confirm → Block Calendar → Send Notifications
                         │
                         └─→ Reject → Release Dates → Send Notifications
```

### System Components

1. **Data Layer**: Extended Property model with `bookingMode` field
2. **Booking Service**: Enhanced with mode-aware booking creation logic
3. **Calendar Service**: Manages availability blocking and release
4. **Notification Service**: Sends mode-specific notifications
5. **API Layer**: New endpoints for mode management and approval/rejection
6. **Frontend**: UI components for mode selection and booking management

## Components and Interfaces

### 1. Data Models

#### Property Model Extension
```typescript
interface Property {
  id: number;
  ownerId: number;
  title: string;
  description: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
  priceEth: string;
  depositEth: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  status: PropertyStatus;
  isApproved: boolean;
  isVerified: boolean;
  bookingMode: 'INSTANT' | 'REQUEST'; // NEW FIELD
  createdAt: Date;
  updatedAt: Date;
}
```

#### Booking Model Extension
```typescript
interface Booking {
  id: number;
  tenantId: number;
  propertyId: number;
  status: BookingStatus; // PENDING, CONFIRMED, REJECTED, CANCELLED
  startDate: Date;
  endDate: Date;
  txHash?: string;
  escrowAmount?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  currency?: string;
  tenantConfirmed: boolean;
  ownerConfirmed: boolean;
  timeoutAt?: Date;
  promoCodeId?: number;
  discountApplied: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### BookingTransition Model (NEW)
```typescript
interface BookingTransition {
  id: number;
  bookingId: number;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  reason?: string;
  performedBy: number; // User ID
  performedAt: Date;
}
```

### 2. Service Interfaces

#### BookingService
```typescript
interface BookingService {
  // Existing methods
  create(tenantId: number, data: CreateBookingInput): Promise<BookingResult>;
  getByUser(userId: number, role: string): Promise<Booking[]>;
  getById(id: number, requestingUserId: number, requestingUserRole: string): Promise<Booking>;
  cancel(id: number, userId: number, userRole: string): Promise<Booking>;
  
  // NEW methods for mode-aware operations
  createBookingByMode(tenantId: number, data: CreateBookingInput): Promise<BookingResult>;
  approveBooking(bookingId: number, ownerId: number): Promise<Booking>;
  rejectBooking(bookingId: number, ownerId: number, reason?: string): Promise<Booking>;
  getBookingsByStatus(userId: number, status: BookingStatus): Promise<Booking[]>;
}
```

#### PropertyService
```typescript
interface PropertyService {
  // Existing methods
  create(ownerId: number, data: CreatePropertyInput): Promise<Property>;
  getById(id: number): Promise<Property>;
  update(id: number, ownerId: number, data: UpdatePropertyInput): Promise<Property>;
  
  // NEW methods for booking mode management
  setBookingMode(propertyId: number, ownerId: number, mode: 'INSTANT' | 'REQUEST'): Promise<Property>;
  getBookingMode(propertyId: number): Promise<'INSTANT' | 'REQUEST'>;
  bulkSetBookingMode(propertyIds: number[], ownerId: number, mode: 'INSTANT' | 'REQUEST'): Promise<Property[]>;
}
```

#### NotificationService
```typescript
interface NotificationService {
  // Existing methods
  create(userId: number, type: NotificationType, message: string, metadata?: Record<string, any>): Promise<Notification>;
  
  // NEW notification types
  INSTANT_BOOKING_CONFIRMED: 'INSTANT_BOOKING_CONFIRMED';
  BOOKING_REQUEST_CREATED: 'BOOKING_REQUEST_CREATED';
  BOOKING_APPROVED: 'BOOKING_APPROVED';
  BOOKING_REJECTED: 'BOOKING_REJECTED';
  BOOKING_APPROVAL_REMINDER: 'BOOKING_APPROVAL_REMINDER';
}
```

### 3. API Endpoints

#### Property Booking Mode Management
```
PATCH /api/properties/:id/booking-mode
  Request: { bookingMode: 'INSTANT' | 'REQUEST' }
  Response: { property: Property }
  Authorization: Owner only

GET /api/properties/:id/booking-mode
  Response: { bookingMode: 'INSTANT' | 'REQUEST' }
  Authorization: Public

PATCH /api/properties/bulk/booking-mode
  Request: { propertyIds: number[], bookingMode: 'INSTANT' | 'REQUEST' }
  Response: { properties: Property[] }
  Authorization: Owner only
```

#### Booking Management
```
POST /api/bookings
  Request: CreateBookingInput
  Response: { booking: Booking, contractParams?: any }
  Authorization: Tenant
  Note: Behavior depends on property's bookingMode

PATCH /api/bookings/:id/approve
  Request: { }
  Response: { booking: Booking }
  Authorization: Owner only

PATCH /api/bookings/:id/reject
  Request: { reason?: string }
  Response: { booking: Booking }
  Authorization: Owner only

GET /api/bookings?status=PENDING&mode=REQUEST
  Response: { bookings: Booking[], total: number }
  Authorization: Owner/Tenant/Admin
```

## Data Models

### Prisma Schema Updates

```prisma
enum BookingMode {
  INSTANT
  REQUEST
}

model Property {
  // ... existing fields ...
  bookingMode BookingMode @default(REQUEST) @map("booking_mode")
  
  // ... existing relations ...
  bookingTransitions BookingTransition[]
}

model Booking {
  // ... existing fields ...
  // No changes needed - status field handles state
  transitions BookingTransition[]
}

model BookingTransition {
  id          Int       @id @default(autoincrement())
  bookingId   Int       @map("booking_id")
  fromStatus  String    @map("from_status")
  toStatus    String    @map("to_status")
  reason      String?   @db.Text
  performedBy Int       @map("performed_by")
  performedAt DateTime  @default(now()) @map("performed_at")
  
  booking     Booking   @relation(fields: [bookingId], references: [id])
  performer   User      @relation(fields: [performedBy], references: [id])
  
  @@index([bookingId])
  @@index([performedAt])
  @@map("booking_transitions")
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Booking Mode Persistence

*For any* property with a selected booking mode, retrieving that property from the database SHALL return the same booking mode that was set.

**Validates: Requirements 1.2, 1.3, 8.3**

### Property 2: Instant Booking Creates Confirmed Status

*For any* property with Instant booking mode enabled and any valid booking request, the resulting booking SHALL have a status of Confirmed immediately upon creation.

**Validates: Requirements 2.1, 6.1**

### Property 3: Request-Based Booking Creates Pending Status

*For any* property with Request-Based booking mode enabled and any valid booking request, the resulting booking SHALL have a status of Pending immediately upon creation.

**Validates: Requirements 3.1, 6.1**

### Property 4: Calendar Blocking on Confirmation

*For any* confirmed booking (whether instant or approved), the property's availability calendar SHALL have all dates between startDate and endDate marked as booked.

**Validates: Requirements 2.2, 4.3, 8.4**

### Property 5: Date Conflict Detection

*For any* property with existing confirmed bookings, attempting to create a new booking with overlapping dates SHALL result in rejection with a descriptive error message.

**Validates: Requirements 2.5, 4.1, 4.2**

### Property 6: Booking Mode Change Affects Only New Bookings

*For any* property where the booking mode is changed, existing bookings with Pending or Confirmed status SHALL retain their current status and not be affected by the mode change.

**Validates: Requirements 5.3, 8.3**

### Property 7: Valid Status Transitions

*For any* booking in Pending status, transitions SHALL only be allowed to Confirmed or Rejected status. For any booking in Confirmed status, transitions SHALL only be allowed to Cancelled status. For any booking in Rejected or Cancelled status, no further transitions SHALL be allowed.

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 8: Calendar Release on Rejection or Cancellation

*For any* booking that transitions to Rejected or Cancelled status, all dates between startDate and endDate in the property's availability calendar SHALL be marked as available (not booked).

**Validates: Requirements 4.4, 8.5**

### Property 9: Booking Mode Default Value

*For any* property created without an explicit booking mode specification, the booking mode SHALL default to Request-Based.

**Validates: Requirements 1.5**

### Property 10: Bulk Mode Change Consistency

*For any* bulk operation that changes booking mode across multiple properties, all specified properties SHALL have their booking mode updated to the requested value, and all properties SHALL be persisted consistently.

**Validates: Requirements 5.5**

### Property 11: Notification Sent on Instant Confirmation

*For any* booking that is instantly confirmed, notifications SHALL be sent to both the guest and the owner with booking details.

**Validates: Requirements 2.3, 2.4, 7.1, 7.2**

### Property 12: Notification Sent on Pending Creation

*For any* booking created in Pending status, a notification SHALL be sent to the owner of the property.

**Validates: Requirements 3.2, 7.3**

### Property 13: Notification Sent on Approval

*For any* booking that transitions from Pending to Confirmed status via owner approval, a notification SHALL be sent to the guest.

**Validates: Requirements 3.3, 7.4**

### Property 14: Notification Sent on Rejection

*For any* booking that transitions from Pending to Rejected status, a notification SHALL be sent to the guest with the rejection reason if provided.

**Validates: Requirements 3.4, 7.5**

### Property 15: Authorization for Approval/Rejection

*For any* booking approval or rejection request, the requesting user SHALL be the owner of the property associated with the booking, or the operation SHALL be rejected with a 403 Forbidden error.

**Validates: Requirements 9.4, 10.2**

### Property 16: Invalid Booking Mode Rejection

*For any* booking mode update request with an invalid mode value (not 'INSTANT' or 'REQUEST'), the system SHALL return a 400 Bad Request error with a descriptive message.

**Validates: Requirements 10.1**

### Property 17: Invalid Date Validation

*For any* booking request with invalid dates (end date before or equal to start date, or start date in the past), the system SHALL return a 400 Bad Request error.

**Validates: Requirements 10.3**

### Property 18: Atomic Booking Persistence

*For any* booking creation, all booking details (tenantId, propertyId, status, dates, etc.) SHALL be persisted to the database atomically, ensuring no partial bookings exist.

**Validates: Requirements 8.1, 8.2**

### Property 19: API Response Includes Booking Mode

*For any* GET request to retrieve property details, the response SHALL include the property's current booking mode.

**Validates: Requirements 9.1**

### Property 20: API Booking Creation Respects Mode

*For any* POST request to create a booking, the system SHALL process the booking according to the property's booking mode, creating either a Confirmed or Pending booking as appropriate.

**Validates: Requirements 9.3**

## Error Handling

### Error Scenarios and Responses

1. **Invalid Booking Mode**
   - Status: 400 Bad Request
   - Message: "Invalid booking mode. Must be 'INSTANT' or 'REQUEST'."
   - Trigger: PATCH /properties/:id/booking-mode with invalid mode

2. **Unauthorized Mode Change**
   - Status: 403 Forbidden
   - Message: "You are not authorized to change the booking mode for this property."
   - Trigger: Non-owner attempts to change property booking mode

3. **Date Conflict**
   - Status: 409 Conflict
   - Message: "Property is not available for the selected dates. Conflicting bookings: [dates]"
   - Trigger: Booking request with overlapping dates

4. **Unauthorized Approval/Rejection**
   - Status: 403 Forbidden
   - Message: "You are not authorized to approve/reject this booking."
   - Trigger: Non-owner attempts to approve/reject booking

5. **Invalid Booking Status Transition**
   - Status: 400 Bad Request
   - Message: "Cannot transition booking from [current status] to [requested status]."
   - Trigger: Attempting invalid status transition

6. **Booking Not Found**
   - Status: 404 Not Found
   - Message: "Booking not found."
   - Trigger: Accessing non-existent booking

7. **Property Not Found**
   - Status: 404 Not Found
   - Message: "Property not found."
   - Trigger: Accessing non-existent property

8. **Invalid Dates**
   - Status: 400 Bad Request
   - Message: "Invalid dates. Start date must be in the future and end date must be after start date."
   - Trigger: Booking with invalid date range

### Error Handling Strategy

- All validation errors return 400 Bad Request with descriptive messages
- All authorization errors return 403 Forbidden
- All not-found errors return 404 Not Found
- Database transaction failures trigger rollback and return 500 Internal Server Error
- Error responses include a `code` field for programmatic handling
- Error messages are user-friendly and suggest corrective actions

## Testing Strategy

### Unit Tests

**Booking Mode Management**
- Test setting booking mode on a property
- Test retrieving booking mode
- Test bulk mode changes
- Test default mode assignment
- Test mode change doesn't affect existing bookings

**Instant Booking Flow**
- Test instant booking creates Confirmed status
- Test calendar is blocked on instant confirmation
- Test notifications are sent on instant confirmation
- Test date conflicts are detected and rejected

**Request-Based Booking Flow**
- Test request-based booking creates Pending status
- Test owner can approve pending bookings
- Test owner can reject pending bookings
- Test notifications are sent appropriately

**Status Transitions**
- Test valid transitions from each status
- Test invalid transitions are rejected
- Test transition history is recorded

**Authorization**
- Test only owners can change booking mode
- Test only owners can approve/reject bookings
- Test guests cannot perform owner actions

**Error Handling**
- Test invalid booking mode returns 400
- Test unauthorized access returns 403
- Test date conflicts return 409
- Test invalid dates return 400

### Property-Based Tests

**Property 1: Booking Mode Persistence**
- Generate random properties with random booking modes
- Set the mode, retrieve the property, verify mode matches
- Test with both INSTANT and REQUEST modes

**Property 2: Instant Booking Creates Confirmed Status**
- Generate properties with INSTANT mode
- Create bookings for these properties
- Verify all bookings have Confirmed status

**Property 3: Request-Based Booking Creates Pending Status**
- Generate properties with REQUEST mode
- Create bookings for these properties
- Verify all bookings have Pending status

**Property 4: Calendar Blocking on Confirmation**
- Generate bookings and confirm them
- Query availability calendar
- Verify all dates are marked as booked

**Property 5: Date Conflict Detection**
- Generate confirmed bookings with date ranges
- Attempt to create overlapping bookings
- Verify conflicts are detected and rejected

**Property 6: Booking Mode Change Affects Only New Bookings**
- Create bookings with one mode
- Change the mode
- Create new bookings
- Verify old bookings retain original status, new bookings use new mode

**Property 7: Valid Status Transitions**
- Generate bookings in each status
- Attempt all possible transitions
- Verify only valid transitions succeed

**Property 8: Calendar Release on Rejection or Cancellation**
- Create confirmed bookings
- Reject or cancel them
- Verify calendar dates are released

**Property 9: Booking Mode Default Value**
- Create properties without specifying booking mode
- Verify all default to REQUEST mode

**Property 10: Bulk Mode Change Consistency**
- Generate multiple properties
- Perform bulk mode change
- Verify all properties have new mode

**Property 11-14: Notifications**
- Mock notification service
- Perform booking operations
- Verify correct notifications are sent with correct parameters

**Property 15: Authorization for Approval/Rejection**
- Generate bookings owned by different users
- Attempt approval/rejection by non-owner
- Verify 403 Forbidden is returned

**Property 16: Invalid Booking Mode Rejection**
- Attempt to set invalid booking modes
- Verify 400 Bad Request is returned

**Property 17: Invalid Date Validation**
- Generate bookings with invalid dates
- Verify 400 Bad Request is returned

**Property 18: Atomic Booking Persistence**
- Create bookings with various data
- Verify all fields are persisted correctly
- Verify no partial bookings exist

**Property 19: API Response Includes Booking Mode**
- Make GET requests for property details
- Verify booking mode is included in response

**Property 20: API Booking Creation Respects Mode**
- Create bookings via API for properties with different modes
- Verify bookings are created with correct status

### Integration Tests

- Test end-to-end instant booking flow
- Test end-to-end request-based booking flow
- Test mode change with concurrent bookings
- Test calendar consistency across operations
- Test notification delivery
- Test database transaction rollback on failure

### Test Coverage Goals

- Unit tests: 90%+ coverage of business logic
- Property tests: 100 iterations per property
- Integration tests: All critical workflows
- Error scenarios: All error paths covered

