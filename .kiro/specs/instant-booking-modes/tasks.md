# Implementation Plan: Instant Booking vs Request-Based Modes

## Overview

This implementation plan converts the feature design into a series of incremental coding tasks. The feature adds dual booking modes to the property rental platform, allowing owners to choose between Instant (automatic confirmation) and Request-Based (owner approval required) booking flows. The implementation extends the existing booking infrastructure with mode-aware logic, new API endpoints, and enhanced notification handling.

The tasks are organized to build incrementally, starting with data model changes, then service layer enhancements, followed by API endpoints, and finally frontend integration. Each task builds on previous work with no orphaned code.

## Tasks

- [ ] 1. Database Schema and Migrations
  - [ ] 1.1 Add BookingMode enum and bookingMode field to Property model
    - Add `BookingMode` enum with INSTANT and REQUEST values to Prisma schema
    - Add `bookingMode` field to Property model with default value REQUEST
    - Create Prisma migration for the schema changes
    - _Requirements: 1.1, 1.5, 8.3_
  
  - [ ] 1.2 Create BookingTransition model for audit logging
    - Add `BookingTransition` model to Prisma schema with fields: id, bookingId, fromStatus, toStatus, reason, performedBy, performedAt
    - Add relations to Booking and User models
    - Create Prisma migration
    - _Requirements: 6.5_
  
  - [ ] 1.3 Run migrations and verify schema
    - Execute `prisma migrate dev` to apply migrations
    - Verify schema changes in database
    - Update Prisma client types
    - _Requirements: 1.1, 1.2_

- [ ] 2. Property Service Enhancements
  - [ ] 2.1 Create PropertyService with booking mode methods
    - Create new file `backend/src/services/property.service.ts`
    - Implement `setBookingMode(propertyId, ownerId, mode)` method
    - Implement `getBookingMode(propertyId)` method
    - Implement `bulkSetBookingMode(propertyIds, ownerId, mode)` method
    - Add authorization checks to ensure only owners can modify their properties
    - _Requirements: 1.2, 1.3, 5.2, 5.5_
  
  - [ ]* 2.2 Write property tests for PropertyService booking mode methods
    - **Property 1: Booking Mode Persistence**
    - **Property 9: Booking Mode Default Value**
    - **Property 10: Bulk Mode Change Consistency**
    - Create test file `backend/src/__tests__/services/property.service.test.ts`
    - Test mode persistence across database operations
    - Test default mode assignment
    - Test bulk operations
    - _Requirements: 1.2, 1.3, 1.5, 5.5_

- [ ] 3. Booking Service Core Logic
  - [ ] 3.1 Refactor booking creation to support mode-aware logic
    - Modify `BookingService.create()` to retrieve property booking mode
    - Add conditional logic: if INSTANT mode, set status to CONFIRMED; if REQUEST mode, set status to PENDING
    - Extract booking creation logic into `createBookingByMode()` method
    - Ensure calendar blocking happens for both modes
    - _Requirements: 2.1, 3.1, 6.1_
  
  - [ ] 3.2 Implement booking approval workflow
    - Add `approveBooking(bookingId, ownerId)` method to BookingService
    - Validate booking is in PENDING status
    - Validate requesting user is the property owner
    - Transition booking to CONFIRMED status
    - Block calendar dates
    - Record transition in BookingTransition table
    - Send approval notification to guest
    - _Requirements: 3.3, 6.2, 7.4_
  
  - [ ] 3.3 Implement booking rejection workflow
    - Add `rejectBooking(bookingId, ownerId, reason?)` method to BookingService
    - Validate booking is in PENDING status
    - Validate requesting user is the property owner
    - Transition booking to REJECTED status
    - Release calendar dates
    - Record transition in BookingTransition table
    - Send rejection notification to guest with reason
    - _Requirements: 3.4, 6.2, 7.5_
  
  - [ ] 3.4 Implement booking status transition validation
    - Add `validateStatusTransition(fromStatus, toStatus)` method
    - Enforce valid transitions: PENDING→CONFIRMED/REJECTED, CONFIRMED→CANCELLED, terminal states prevent further transitions
    - Throw descriptive errors for invalid transitions
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ]* 3.5 Write property tests for booking mode logic
    - **Property 2: Instant Booking Creates Confirmed Status**
    - **Property 3: Request-Based Booking Creates Pending Status**
    - **Property 7: Valid Status Transitions**
    - Create test file `backend/src/__tests__/services/booking.mode.test.ts`
    - Test instant bookings create CONFIRMED status
    - Test request bookings create PENDING status
    - Test status transition validation
    - _Requirements: 2.1, 3.1, 6.1, 6.2, 6.3, 6.4_

- [ ] 4. Calendar and Availability Management
  - [ ] 4.1 Enhance CalendarService for mode-aware blocking
    - Modify `CalendarService.blockDates()` to work with both instant and approved bookings
    - Ensure dates are blocked atomically when booking is confirmed
    - _Requirements: 2.2, 4.3_
  
  - [ ] 4.2 Implement calendar release on rejection/cancellation
    - Add `releaseDates(propertyId, startDate, endDate)` method to CalendarService
    - Remove booking entries from availability calendar
    - Mark dates as available
    - _Requirements: 4.4, 8.5_
  
  - [ ]* 4.3 Write property tests for calendar operations
    - **Property 4: Calendar Blocking on Confirmation**
    - **Property 5: Date Conflict Detection**
    - **Property 8: Calendar Release on Rejection or Cancellation**
    - Create test file `backend/src/__tests__/services/calendar.mode.test.ts`
    - Test calendar blocking on instant confirmation
    - Test calendar blocking on approval
    - Test date conflict detection
    - Test calendar release on rejection
    - Test calendar release on cancellation
    - _Requirements: 2.2, 4.1, 4.2, 4.3, 4.4, 8.4, 8.5_

- [ ] 5. Notification System Integration
  - [ ] 5.1 Add new notification types for booking modes
    - Add to NotificationType enum: INSTANT_BOOKING_CONFIRMED, BOOKING_REQUEST_CREATED, BOOKING_APPROVED, BOOKING_REJECTED, BOOKING_APPROVAL_REMINDER
    - Update NotificationService to handle new types
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 5.2 Implement instant booking notifications
    - Modify booking creation to send INSTANT_BOOKING_CONFIRMED notification to guest when mode is INSTANT
    - Send notification to owner about confirmed booking
    - Include booking details in notification metadata
    - _Requirements: 2.3, 2.4, 7.1, 7.2_
  
  - [ ] 5.3 Implement request-based booking notifications
    - Send BOOKING_REQUEST_CREATED notification to owner when booking is created in REQUEST mode
    - Include booking details and link to review
    - _Requirements: 3.2, 7.3_
  
  - [ ] 5.4 Implement approval/rejection notifications
    - Send BOOKING_APPROVED notification to guest when owner approves
    - Send BOOKING_REJECTED notification to guest when owner rejects
    - Include rejection reason in rejection notification
    - _Requirements: 3.3, 3.4, 7.4, 7.5_
  
  - [ ]* 5.5 Write property tests for notifications
    - **Property 11: Notification Sent on Instant Confirmation**
    - **Property 12: Notification Sent on Pending Creation**
    - **Property 13: Notification Sent on Approval**
    - **Property 14: Notification Sent on Rejection**
    - Create test file `backend/src/__tests__/services/notification.mode.test.ts`
    - Mock NotificationService
    - Test notifications are sent with correct parameters
    - Test notifications include required metadata
    - _Requirements: 2.3, 2.4, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. API Endpoints for Property Booking Mode
  - [ ] 6.1 Create property booking mode routes
    - Create new file `backend/src/routes/propertyBookingMode.routes.ts`
    - Implement PATCH /api/properties/:id/booking-mode endpoint
    - Implement GET /api/properties/:id/booking-mode endpoint
    - Implement PATCH /api/properties/bulk/booking-mode endpoint
    - Add authentication and authorization middleware
    - Add input validation using Zod schemas
    - _Requirements: 9.1, 9.2_
  
  - [ ] 6.2 Create Zod schemas for booking mode validation
    - Create file `backend/src/schemas/bookingMode.schemas.ts`
    - Define schema for setting booking mode (validate mode is INSTANT or REQUEST)
    - Define schema for bulk mode change
    - _Requirements: 10.1_
  
  - [ ] 6.3 Register property booking mode routes in main app
    - Import and register routes in `backend/src/index.ts`
    - Ensure routes are mounted at correct path
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 6.4 Write property tests for property booking mode endpoints
    - **Property 16: Invalid Booking Mode Rejection**
    - **Property 19: API Response Includes Booking Mode**
    - Create test file `backend/src/__tests__/routes/propertyBookingMode.routes.test.ts`
    - Test GET endpoint returns booking mode
    - Test PATCH endpoint validates mode
    - Test PATCH endpoint rejects invalid modes with 400
    - Test authorization (only owner can change mode)
    - Test bulk endpoint changes all properties
    - _Requirements: 9.1, 9.2, 10.1_

- [ ] 7. API Endpoints for Booking Approval/Rejection
  - [ ] 7.1 Add approval/rejection endpoints to booking routes
    - Add PATCH /api/bookings/:id/approve endpoint
    - Add PATCH /api/bookings/:id/reject endpoint
    - Add authentication and authorization middleware
    - Add input validation for rejection reason
    - _Requirements: 9.4_
  
  - [ ] 7.2 Create Zod schemas for approval/rejection
    - Add schema for rejection request (optional reason field)
    - _Requirements: 10.5_
  
  - [ ] 7.3 Update booking routes file
    - Add new endpoints to `backend/src/routes/booking.routes.ts`
    - Call BookingService.approveBooking() and rejectBooking()
    - Handle errors and return appropriate status codes
    - _Requirements: 9.4_
  
  - [ ]* 7.4 Write property tests for approval/rejection endpoints
    - **Property 15: Authorization for Approval/Rejection**
    - Create test file `backend/src/__tests__/routes/booking.approval.test.ts`
    - Test only owner can approve/reject
    - Test non-owner gets 403 Forbidden
    - Test approval transitions booking to CONFIRMED
    - Test rejection transitions booking to REJECTED
    - Test rejection reason is included in notification
    - _Requirements: 9.4, 10.2_

- [ ] 8. Booking Creation API Enhancement
  - [ ] 8.1 Update booking creation endpoint to respect booking mode
    - Modify POST /api/bookings endpoint to use new mode-aware logic
    - Ensure instant bookings return CONFIRMED status
    - Ensure request bookings return PENDING status
    - _Requirements: 9.3_
  
  - [ ] 8.2 Update booking list endpoint with filtering
    - Enhance GET /api/bookings endpoint to support status and mode filtering
    - Add query parameters: status, bookingMode
    - _Requirements: 9.5_
  
  - [ ]* 8.3 Write property tests for booking creation endpoint
    - **Property 20: API Booking Creation Respects Mode**
    - Create test file `backend/src/__tests__/routes/booking.creation.test.ts`
    - Test instant mode creates CONFIRMED bookings
    - Test request mode creates PENDING bookings
    - Test date conflict detection returns 409
    - Test invalid dates return 400
    - _Requirements: 9.3, 10.3_

- [ ] 9. Error Handling and Validation
  - [ ] 9.1 Implement comprehensive error handling
    - Add error handling for invalid booking modes (400)
    - Add error handling for unauthorized access (403)
    - Add error handling for date conflicts (409)
    - Add error handling for invalid dates (400)
    - Add error handling for invalid status transitions (400)
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 9.2 Create error response utilities
    - Create file `backend/src/utils/errorResponses.ts`
    - Define standard error response format with code, message, details
    - Export helper functions for common errors
    - _Requirements: 10.5_
  
  - [ ]* 9.3 Write property tests for error handling
    - **Property 17: Invalid Date Validation**
    - Create test file `backend/src/__tests__/error-handling.test.ts`
    - Test all error scenarios return correct status codes
    - Test error messages are descriptive
    - Test error responses include helpful information
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 10. Data Persistence and Consistency
  - [ ] 10.1 Implement atomic booking operations
    - Ensure booking creation is atomic (all fields persisted together)
    - Use database transactions for status transitions
    - Ensure calendar updates are atomic with booking updates
    - _Requirements: 8.1, 8.2_
  
  - [ ] 10.2 Implement transition history recording
    - Modify approveBooking() to record transition in BookingTransition table
    - Modify rejectBooking() to record transition in BookingTransition table
    - Include reason and performer information
    - _Requirements: 6.5_
  
  - [ ]* 10.3 Write property tests for data persistence
    - **Property 18: Atomic Booking Persistence**
    - Create test file `backend/src/__tests__/persistence.test.ts`
    - Test all booking fields are persisted
    - Test transitions are recorded
    - Test no partial bookings exist
    - _Requirements: 8.1, 8.2, 6.5_

- [ ] 11. Checkpoint - Backend Implementation Complete
  - Ensure all backend tests pass
  - Verify database migrations applied successfully
  - Test all API endpoints manually with Postman or similar
  - Ask the user if questions arise

- [ ] 12. Frontend: Property Settings UI
  - [ ] 12.1 Create booking mode selector component
    - Create file `frontend/src/components/BookingModeSelector.tsx`
    - Implement radio button or toggle for INSTANT/REQUEST selection
    - Display current booking mode
    - _Requirements: 1.1, 1.4_
  
  - [ ] 12.2 Integrate booking mode selector into property edit page
    - Update `frontend/src/app/properties/[id]/edit/page.tsx`
    - Add BookingModeSelector component
    - Call API to update booking mode on change
    - Show success/error messages
    - _Requirements: 1.2, 1.4_
  
  - [ ] 12.3 Display booking mode in property list view
    - Update property list component to show booking mode
    - Add visual indicator for INSTANT vs REQUEST
    - _Requirements: 5.4_

- [ ] 13. Frontend: Booking Management UI
  - [ ] 13.1 Create booking approval/rejection component
    - Create file `frontend/src/components/BookingApprovalPanel.tsx`
    - Display pending bookings for owner
    - Show booking details (dates, guest info, price)
    - Implement approve button
    - Implement reject button with optional reason field
    - _Requirements: 3.3, 3.4_
  
  - [ ] 13.2 Integrate approval panel into owner dashboard
    - Update owner dashboard to show pending bookings
    - Display BookingApprovalPanel for each pending booking
    - Call API endpoints to approve/reject
    - Show success/error messages
    - _Requirements: 3.3, 3.4_
  
  - [ ] 13.3 Update booking status display
    - Update booking detail view to show current status
    - Display status history/transitions
    - Show different UI based on booking mode
    - _Requirements: 6.1, 6.5_

- [ ] 14. Frontend: Booking Creation Flow
  - [ ] 14.1 Update booking creation to show mode-specific messaging
    - Modify booking confirmation page to show different messages for INSTANT vs REQUEST
    - For INSTANT: "Your booking is confirmed!"
    - For REQUEST: "Your booking request has been sent to the owner"
    - _Requirements: 2.1, 3.1_
  
  - [ ] 14.2 Add booking mode indicator to property details
    - Show booking mode on property detail page
    - Display expected confirmation time based on mode
    - _Requirements: 1.4_

- [ ] 15. Frontend: Notifications and Alerts
  - [ ] 15.1 Update notification display for new notification types
    - Handle INSTANT_BOOKING_CONFIRMED notifications
    - Handle BOOKING_REQUEST_CREATED notifications
    - Handle BOOKING_APPROVED notifications
    - Handle BOOKING_REJECTED notifications
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 15.2 Add notification badges for pending approvals
    - Show badge on owner dashboard with count of pending bookings
    - Update badge count in real-time
    - _Requirements: 3.2_

- [ ] 16. Integration Testing
  - [ ] 16.1 Create end-to-end test for instant booking flow
    - Create test file `backend/src/__tests__/integration/instant-booking.integration.test.ts`
    - Test complete flow: create property with INSTANT mode → guest books → booking confirmed → calendar blocked → notifications sent
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 16.2 Create end-to-end test for request-based booking flow
    - Create test file `backend/src/__tests__/integration/request-booking.integration.test.ts`
    - Test complete flow: create property with REQUEST mode → guest books → booking pending → owner approves → booking confirmed → calendar blocked → notifications sent
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 16.3 Create end-to-end test for booking rejection flow
    - Test complete flow: pending booking → owner rejects → booking rejected → calendar released → notification sent
    - _Requirements: 3.4, 4.4, 7.5_
  
  - [ ] 16.4 Create end-to-end test for mode change
    - Test changing property mode doesn't affect existing bookings
    - Test new bookings use new mode
    - _Requirements: 5.2, 5.3, 8.3_
  
  - [ ]* 16.5 Create end-to-end test for bulk mode change
    - Test bulk mode change across multiple properties
    - Verify all properties updated
    - _Requirements: 5.5_

- [ ] 17. Final Checkpoint - All Tests Pass
  - Ensure all unit tests pass
  - Ensure all property tests pass (100+ iterations each)
  - Ensure all integration tests pass
  - Verify frontend builds without errors
  - Ask the user if questions arise

- [ ] 18. Documentation and Cleanup
  - [ ] 18.1 Update API documentation
    - Document new endpoints in Swagger/OpenAPI
    - Include request/response examples
    - Document error responses
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 18.2 Update database schema documentation
    - Document new BookingMode enum
    - Document BookingTransition model
    - Document booking mode field on Property
    - _Requirements: 1.1, 1.2_
  
  - [ ] 18.3 Clean up temporary test files
    - Remove any debug or temporary files
    - Ensure all code follows project conventions
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests should run with minimum 100 iterations
- All API endpoints require authentication and appropriate authorization
- Database transactions should be used for operations that modify multiple tables
- Error messages should be user-friendly and suggest corrective actions
- The implementation maintains backward compatibility by defaulting to REQUEST mode
- Existing bookings are not affected by property mode changes

