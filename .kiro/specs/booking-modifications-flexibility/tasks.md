# Implementation Plan: Booking Modifications & Flexibility

## Overview

This implementation plan breaks down the booking modifications and flexibility feature into discrete, incremental coding tasks. The feature extends the existing booking system with modification workflows, cancellation policies, add-on services, and refund calculations. Each task builds on previous work, with property-based tests integrated throughout to catch errors early.

The implementation follows a layered approach:
1. Database schema extensions (Prisma models)
2. Service layer implementation (business logic)
3. API endpoint implementation
4. Notification integration
5. Testing and validation

## Tasks

- [ ] 1. Extend Prisma schema with new models
  - [ ] 1.1 Add CancellationPolicy model to schema
    - Define policy types (STRICT, MODERATE, FLEXIBLE)
    - Add refund tier configuration fields
    - Add property and booking relations
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 1.2 Add AddOnService model to schema
    - Define service types (CLEANING, LAUNDRY, TOURS)
    - Add pricing and availability fields
    - Add capacity management fields
    - _Requirements: 2.1, 2.2, 8.1_
  
  - [ ] 1.3 Add BookingAddOn model to schema
    - Link bookings to add-on services
    - Store pricing at time of booking
    - _Requirements: 2.3, 2.4_
  
  - [ ] 1.4 Add BookingModification model to schema
    - Store modification requests with old/new values
    - Add approval workflow fields
    - Add expiration tracking
    - _Requirements: 1.5, 5.1, 5.2, 5.3_
  
  - [ ] 1.5 Add RefundTransaction model to schema
    - Store refund calculations and details
    - Link to cancellation policy
    - Track refund status
    - _Requirements: 4.1, 4.5, 4.6_
  
  - [ ] 1.6 Add AuditLog model to schema
    - Store all modification and cancellation actions
    - Track actor, action, and changes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 1.7 Extend Booking model with new fields
    - Add guestCount field
    - Add cancellationPolicyId foreign key
    - Add totalPrice and basePrice fields
    - Add relations to new models
    - _Requirements: 1.3, 1.4, 3.6, 4.2_
  
  - [ ] 1.8 Extend Property model with new relations
    - Add relations to CancellationPolicy
    - Add relations to AddOnService
    - _Requirements: 2.1, 3.5_
  
  - [ ] 1.9 Create and run Prisma migration
    - Generate migration for all schema changes
    - Test migration on development database
    - _Requirements: All_

- [ ] 2. Implement CancellationPolicyService
  - [ ] 2.1 Implement policy configuration
    - Create setPolicy method to set property cancellation policy
    - Validate policy type is one of STRICT, MODERATE, FLEXIBLE
    - Store policy with property relation
    - _Requirements: 3.1, 3.5_
  
  - [ ] 2.2 Implement policy retrieval
    - Create getPolicy method to fetch property's current policy
    - Handle case where no policy is set (default to MODERATE)
    - _Requirements: 3.6_
  
  - [ ] 2.3 Implement policy details helper
    - Create getPolicyDetails static method returning tier configurations
    - Define STRICT: 30+ days (100%), 7-29 days (50%), <7 days (0%)
    - Define MODERATE: 14+ days (100%), 7-13 days (75%), <7 days (25%)
    - Define FLEXIBLE: 7+ days (100%), 1-6 days (50%), on/after check-in (0%)
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 2.4 Implement refund calculation
    - Create calculateRefund method taking booking and cancellation date
    - Calculate days between cancellation date and check-in date
    - Determine refund tier based on days and policy type
    - Calculate refund amount as percentage of total booking cost
    - Return refund calculation with percentage, amount, tier, and reason
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 2.5 Write property tests for CancellationPolicyService
    - **Property 9: Strict Policy Refund Calculation**
    - **Property 10: Moderate Policy Refund Calculation**
    - **Property 11: Flexible Policy Refund Calculation**
    - **Property 12: Policy Assignment on Booking Creation**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.6**

- [ ] 3. Implement AddOnServiceManager
  - [ ] 3.1 Implement service configuration
    - Create configureService method for property owners
    - Validate service type is one of CLEANING, LAUNDRY, TOURS
    - Store service with pricing, description, and availability constraints
    - _Requirements: 2.1, 2.2, 8.1_
  
  - [ ] 3.2 Implement service retrieval
    - Create method to get all active services for a property
    - Include availability and capacity information
    - _Requirements: 2.1_
  
  - [ ] 3.3 Implement add-on to booking
    - Create addServiceToBooking method
    - Validate service availability for booking dates
    - Check capacity if service has limit
    - Create BookingAddOn record with pricing
    - Update booking total price
    - _Requirements: 2.3, 8.2, 8.4_
  
  - [ ] 3.4 Implement remove add-on from booking
    - Create removeServiceFromBooking method
    - Subtract service cost from booking total
    - Release capacity if service has limit
    - _Requirements: 2.5, 8.6_
  
  - [ ] 3.5 Implement availability validation
    - Create validateAvailability method
    - Check if booking dates fall within service availability window
    - Check if booking dates match available days of week
    - Return availability status with reason if unavailable
    - _Requirements: 8.2, 8.3_
  
  - [ ] 3.6 Implement capacity management
    - Create checkCapacity method to verify capacity available
    - Create reserveCapacity method to reserve capacity
    - Create releaseCapacity method to free capacity on cancellation
    - _Requirements: 8.4, 8.5, 8.6_
  
  - [ ]* 3.7 Write property tests for AddOnServiceManager
    - **Property 5: Add-on Service Round-trip**
    - **Property 6: Add-on Cost Addition**
    - **Property 7: Cumulative Add-on Costs**
    - **Property 8: Add-on Removal Idempotence**
    - **Property 18: Add-on Availability Validation**
    - **Property 19: Add-on Capacity Enforcement**
    - **Property 20: Capacity Release on Cancellation**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 8.2, 8.4, 8.5, 8.6**

- [ ] 4. Implement ModificationService
  - [ ] 4.1 Implement modification request creation
    - Create requestModification method
    - Validate modification type (DATES, GUEST_COUNT, ADD_ONS, MULTIPLE)
    - Create BookingModification record with PENDING status
    - Set expiration to 48 hours from now
    - Calculate new price based on modification
    - _Requirements: 1.5, 5.1_
  
  - [ ] 4.2 Implement modification validation
    - Create validateModification method
    - Check for date conflicts with other bookings
    - Validate guest count doesn't exceed property capacity
    - Validate new dates are in future
    - Validate modification is for valid booking
    - Return validation result with errors if invalid
    - _Requirements: 1.2, 1.4_
  
  - [ ] 4.3 Implement price recalculation
    - Create recalculatePrice method
    - Calculate new price based on new dates and current add-ons
    - Calculate price difference (increase/decrease)
    - _Requirements: 1.3, 7.1, 7.3_
  
  - [ ] 4.4 Implement modification approval
    - Create approveModification method (owner only)
    - Update booking with new parameters
    - Set modification status to APPROVED
    - Update availability records
    - Create audit log entry
    - _Requirements: 5.2, 5.4, 5.5_
  
  - [ ] 4.5 Implement modification rejection
    - Create rejectModification method (owner only)
    - Set modification status to REJECTED
    - Store rejection reason
    - Create audit log entry
    - _Requirements: 5.3_
  
  - [ ] 4.6 Implement modification expiration
    - Create expireOldRequests method (scheduled task)
    - Find all PENDING modifications past expiration time
    - Set status to EXPIRED
    - Create audit log entries
    - _Requirements: 5.6_
  
  - [ ] 4.7 Implement modification history retrieval
    - Create getModificationHistory method
    - Return all modifications for booking in chronological order
    - Include all details (old values, new values, status, etc.)
    - _Requirements: 9.6_
  
  - [ ]* 4.8 Write property tests for ModificationService
    - **Property 1: Modification Request Creation**
    - **Property 2: Modification Conflict Detection**
    - **Property 3: Price Recalculation on Date Modification**
    - **Property 4: Guest Count Capacity Validation**
    - **Property 14: Modification Approval Updates Booking**
    - **Property 15: Modification Rejection Preserves Booking**
    - **Property 17: Price Difference Calculation**
    - **Property 24: Modification Request Expiration**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.6**

- [ ] 5. Implement CancellationService
  - [ ] 5.1 Implement cancellation preview
    - Create previewCancellation method
    - Calculate refund using CancellationPolicyService
    - Return refund amount and percentage without processing
    - _Requirements: 4.4_
  
  - [ ] 5.2 Implement cancellation validation
    - Create validateCancellation method
    - Check booking is in cancellable state
    - Check cancellation is within policy window
    - Return validation result with reason if invalid
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 5.3 Implement cancellation processing
    - Create processCancellation method
    - Validate cancellation is allowed
    - Calculate refund using CancellationPolicyService
    - Create RefundTransaction record
    - Update booking status to REFUNDED
    - Release add-on service capacity
    - Create audit log entry
    - _Requirements: 4.5, 4.6, 6.4, 6.5_
  
  - [ ] 5.4 Implement refund transaction creation
    - Create createRefundTransaction method
    - Store all refund calculation details
    - Link to cancellation policy
    - Set status to PENDING
    - _Requirements: 4.5_
  
  - [ ]* 5.5 Write property tests for CancellationService
    - **Property 13: Refund Calculation Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 6. Implement AuditLogService
  - [ ] 6.1 Implement audit log creation
    - Create createAuditLog method
    - Store action, actor, old values, new values, metadata
    - Link to booking
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 6.2 Implement audit log retrieval
    - Create getAuditLogs method
    - Return all audit logs for booking in chronological order
    - Include all details
    - _Requirements: 9.6_
  
  - [ ]* 6.3 Write property tests for AuditLogService
    - **Property 21: Audit Trail Completeness**
    - **Property 22: Audit Trail Immutability**
    - **Property 23: Modification History Retrieval**
    - **Validates: Requirements 9.1, 9.5, 9.6**

- [ ] 7. Implement API endpoints for modifications
  - [ ] 7.1 POST /api/bookings/:id/modifications
    - Request modification
    - Validate tenant is booking owner
    - Call ModificationService.requestModification
    - Return modification details with expiration
    - _Requirements: 1.5, 5.1_
  
  - [ ] 7.2 GET /api/bookings/:id/modifications
    - Get modification history
    - Validate user has access to booking
    - Call ModificationService.getModificationHistory
    - Return all modifications
    - _Requirements: 9.6_
  
  - [ ] 7.3 PATCH /api/modifications/:id/approve
    - Approve modification (owner only)
    - Validate owner is property owner
    - Call ModificationService.approveModification
    - Return updated booking
    - _Requirements: 5.2, 5.4, 5.5_
  
  - [ ] 7.4 PATCH /api/modifications/:id/reject
    - Reject modification (owner only)
    - Validate owner is property owner
    - Call ModificationService.rejectModification
    - Return rejection confirmation
    - _Requirements: 5.3_

- [ ] 8. Implement API endpoints for cancellation policies
  - [ ] 8.1 POST /api/properties/:id/cancellation-policy
    - Set cancellation policy
    - Validate owner is property owner
    - Validate policy type is valid
    - Call CancellationPolicyService.setPolicy
    - Return policy details
    - _Requirements: 3.1, 3.5_
  
  - [ ] 8.2 GET /api/properties/:id/cancellation-policy
    - Get property's cancellation policy
    - Call CancellationPolicyService.getPolicy
    - Return policy details with tier information
    - _Requirements: 3.1_

- [ ] 9. Implement API endpoints for add-on services
  - [ ] 9.1 POST /api/properties/:id/add-on-services
    - Configure add-on service
    - Validate owner is property owner
    - Validate service type is valid
    - Call AddOnServiceManager.configureService
    - Return service details
    - _Requirements: 2.1, 2.2, 8.1_
  
  - [ ] 9.2 GET /api/properties/:id/add-on-services
    - Get property's add-on services
    - Return all active services with availability and capacity
    - _Requirements: 2.1_
  
  - [ ] 9.3 POST /api/bookings/:id/add-ons
    - Add service to booking
    - Validate tenant is booking owner
    - Call AddOnServiceManager.addServiceToBooking
    - Return updated booking with new total
    - _Requirements: 2.3, 8.2, 8.4_
  
  - [ ] 9.4 DELETE /api/bookings/:id/add-ons/:addOnId
    - Remove service from booking
    - Validate tenant is booking owner
    - Call AddOnServiceManager.removeServiceFromBooking
    - Return updated booking with new total
    - _Requirements: 2.5, 8.6_

- [ ] 10. Implement API endpoints for cancellation
  - [ ] 10.1 GET /api/bookings/:id/cancellation-preview
    - Preview refund amount
    - Validate user has access to booking
    - Call CancellationService.previewCancellation
    - Return refund amount, percentage, and policy details
    - _Requirements: 4.4_
  
  - [ ] 10.2 POST /api/bookings/:id/cancel
    - Process cancellation
    - Validate tenant is booking owner
    - Call CancellationService.processCancellation
    - Return refund details and confirmation
    - _Requirements: 4.5, 4.6, 6.4, 6.5_

- [ ] 11. Integrate notifications
  - [ ] 11.1 Send notification on modification request
    - Call NotificationService when modification created
    - Notify owner with modification details
    - _Requirements: 1.6, 10.1_
  
  - [ ] 11.2 Send notification on modification approval
    - Call NotificationService when modification approved
    - Notify tenant with updated booking details
    - _Requirements: 10.2_
  
  - [ ] 11.3 Send notification on modification rejection
    - Call NotificationService when modification rejected
    - Notify tenant with rejection reason
    - _Requirements: 10.3_
  
  - [ ] 11.4 Send notification on modification expiration
    - Call NotificationService when modification expires
    - Notify both tenant and owner
    - _Requirements: 10.4_
  
  - [ ] 11.5 Send notification on cancellation
    - Call NotificationService when cancellation processed
    - Notify owner with refund amount and reason
    - _Requirements: 10.5_
  
  - [ ] 11.6 Send notification on refund issuance
    - Call NotificationService when refund processed
    - Notify tenant with refund amount and timeline
    - _Requirements: 10.6_

- [ ] 12. Implement scheduled tasks
  - [ ] 12.1 Create modification expiration worker
    - Schedule task to run every hour
    - Call ModificationService.expireOldRequests
    - Log number of expired requests
    - _Requirements: 5.6_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass (minimum 100 iterations each)
  - Ensure all integration tests pass
  - Ask the user if questions arise

- [ ] 14. Write integration tests
  - [ ] 14.1 Test end-to-end modification workflow
    - Create booking → Request modification → Owner approves → Booking updated → Notifications sent
    - Verify all state changes and notifications
    - _Requirements: 1.5, 5.1, 5.2, 10.1, 10.2_
  
  - [ ] 14.2 Test modification rejection workflow
    - Create booking → Request modification → Owner rejects → Booking unchanged → Notifications sent
    - Verify rejection reason is stored
    - _Requirements: 5.3, 10.3_
  
  - [ ] 14.3 Test modification expiration workflow
    - Create booking → Request modification → Wait for expiration → Status updated → Notifications sent
    - Verify expiration logic works correctly
    - _Requirements: 5.6, 10.4_
  
  - [ ] 14.4 Test end-to-end cancellation workflow
    - Create booking → Preview cancellation → Process cancellation → Refund created → Notifications sent
    - Verify refund calculation and booking status
    - _Requirements: 4.4, 4.5, 4.6, 10.5, 10.6_
  
  - [ ] 14.5 Test cancellation with add-ons
    - Create booking with add-ons → Cancel → Verify refund includes add-ons → Verify capacity released
    - _Requirements: 2.6, 8.6_
  
  - [ ] 14.6 Test policy enforcement
    - Set strict policy → Create booking → Cancel at different times → Verify correct refund percentages
    - _Requirements: 3.2, 4.1_
  
  - [ ] 14.7 Test policy isolation on change
    - Set policy A → Create booking 1 → Change to policy B → Create booking 2 → Cancel both → Verify booking 1 uses policy A, booking 2 uses policy B
    - _Requirements: 6.6_
  
  - [ ] 14.8 Test add-on service workflow
    - Configure service → Add to booking → Verify price updated → Remove from booking → Verify price restored
    - _Requirements: 2.3, 2.5_
  
  - [ ] 14.9 Test add-on capacity management
    - Configure service with capacity → Multiple bookings request → Verify capacity enforced → Cancel one → Verify capacity released
    - _Requirements: 8.4, 8.5, 8.6_
  
  - [ ] 14.10 Test modification conflict detection
    - Create booking 1 → Request modification with overlapping dates → Verify conflict detected and rejected
    - _Requirements: 1.2_

- [ ] 15. Write unit tests for edge cases
  - [ ] 15.1 Test edge cases for refund calculations
    - Cancellation on exact boundary dates
    - Cancellation on check-in date
    - Cancellation after check-in date
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 15.2 Test edge cases for price calculations
    - Single night bookings
    - Multi-month bookings
    - Bookings with multiple add-ons
    - _Requirements: 1.3, 7.1_
  
  - [ ] 15.3 Test edge cases for capacity management
    - Service with capacity of 1
    - Service with unlimited capacity
    - Multiple concurrent requests
    - _Requirements: 8.4, 8.5_
  
  - [ ] 15.4 Test edge cases for modification validation
    - Modification with same dates (no change)
    - Modification with dates in past
    - Modification with invalid guest count
    - _Requirements: 1.2, 1.4_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass (minimum 100 iterations each)
  - Ensure all integration tests pass
  - Ensure all edge case tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests should use appropriate generators for dates, prices, and policies
- All tests should use mocks for external services (notifications, payments)
- Modification requests expire after 48 hours without approval or rejection
- Refund calculations are performed at cancellation time, not at request time
- Audit logs are immutable and cannot be deleted
- All timestamps use UTC
- Prices are stored as floats with 2 decimal precision
