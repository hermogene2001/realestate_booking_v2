# Requirements Document: Instant Booking vs Request-Based Modes

## Introduction

This feature introduces dual booking modes for property owners on the Rwanda-focused rental platform. Owners can choose between Instant Booking (immediate confirmation without owner approval) and Request-Based Booking (current flow requiring owner confirmation) on a per-property basis. This flexibility allows owners to optimize their booking strategy while maintaining control over their properties.

## Glossary

- **Booking_Mode**: The confirmation strategy for a property (Instant or Request)
- **Instant_Booking**: Automatic booking confirmation without owner intervention
- **Request_Based_Booking**: Booking requiring explicit owner approval before confirmation
- **Owner**: User who owns and manages properties
- **Guest**: User who initiates a booking request
- **Property**: Rental accommodation managed by an owner
- **Booking**: A guest's reservation request for a property
- **Confirmation**: The act of accepting a booking request
- **Rejection**: The act of declining a booking request
- **Booking_Status**: Current state of a booking (Pending, Confirmed, Rejected, Cancelled)
- **Availability**: Calendar dates when a property is available for booking
- **Preference**: Owner's configuration settings for a property

## Requirements

### Requirement 1: Booking Mode Selection

**User Story:** As an owner, I want to choose between Instant and Request-Based booking modes for each property, so that I can control how bookings are processed.

#### Acceptance Criteria

1. WHEN an owner creates a new property, THE System SHALL present booking mode options (Instant or Request-Based)
2. WHEN an owner edits an existing property, THE System SHALL allow changing the booking mode
3. WHEN a booking mode is selected, THE System SHALL persist the selection to the database
4. WHEN an owner views property details, THE System SHALL display the current booking mode
5. THE System SHALL default to Request-Based mode for backward compatibility with existing properties

### Requirement 2: Instant Booking Confirmation

**User Story:** As a guest, I want to receive immediate booking confirmation when booking a property with Instant mode enabled, so that I can have certainty about my reservation immediately.

#### Acceptance Criteria

1. WHEN a guest submits a booking for a property with Instant mode enabled, THE System SHALL immediately create a Confirmed booking without owner intervention
2. WHEN a booking is instantly confirmed, THE System SHALL update the property's availability calendar to block the booked dates
3. WHEN a booking is instantly confirmed, THE System SHALL send a confirmation notification to the guest immediately
4. WHEN a booking is instantly confirmed, THE System SHALL send a notification to the owner about the confirmed booking
5. WHEN a guest attempts to book dates that are already booked, THE System SHALL reject the booking and return an error

### Requirement 3: Request-Based Booking Flow

**User Story:** As an owner, I want to review and approve booking requests before they are confirmed, so that I can maintain control over my property.

#### Acceptance Criteria

1. WHEN a guest submits a booking for a property with Request-Based mode enabled, THE System SHALL create a Pending booking
2. WHEN a booking is created in Pending status, THE System SHALL notify the owner of the new booking request
3. WHEN an owner approves a Pending booking, THE System SHALL change the status to Confirmed and update availability
4. WHEN an owner rejects a Pending booking, THE System SHALL change the status to Rejected and notify the guest
5. WHEN a booking remains Pending for more than 48 hours, THE System SHALL send a reminder notification to the owner

### Requirement 4: Booking Validation and Conflict Prevention

**User Story:** As the system, I want to prevent double-booking and ensure data integrity, so that bookings are always valid and non-conflicting.

#### Acceptance Criteria

1. WHEN a booking is created or confirmed, THE System SHALL check for date conflicts with existing Confirmed bookings
2. IF a date conflict is detected, THEN THE System SHALL reject the booking and return a descriptive error
3. WHEN a booking is confirmed (either instantly or by owner approval), THE System SHALL atomically update the availability calendar
4. WHEN a booking is rejected or cancelled, THE System SHALL release the booked dates back to availability
5. WHEN multiple concurrent booking requests arrive for the same dates, THE System SHALL process them sequentially to prevent race conditions

### Requirement 5: Owner Preference Management

**User Story:** As an owner, I want to manage my booking preferences efficiently, so that I can configure my properties according to my business needs.

#### Acceptance Criteria

1. WHEN an owner accesses property settings, THE System SHALL display the current booking mode preference
2. WHEN an owner changes the booking mode, THE System SHALL apply the change immediately to new bookings
3. WHEN an owner changes the booking mode, THE System SHALL NOT affect existing Pending or Confirmed bookings
4. WHEN an owner views their properties, THE System SHALL display the booking mode for each property in a list view
5. THE System SHALL allow bulk mode changes across multiple properties in a single operation

### Requirement 6: Booking Status Transitions

**User Story:** As the system, I want to enforce valid booking status transitions, so that bookings follow a consistent lifecycle.

#### Acceptance Criteria

1. WHEN a booking is created, THE System SHALL set its initial status based on the property's booking mode
2. WHEN a booking is in Pending status, THE System SHALL allow transitions to Confirmed or Rejected only
3. WHEN a booking is in Confirmed status, THE System SHALL allow transitions to Cancelled only
4. WHEN a booking is in Rejected or Cancelled status, THE System SHALL prevent further status changes
5. WHEN a status transition occurs, THE System SHALL record the timestamp and reason for the transition

### Requirement 7: Notification System Integration

**User Story:** As a user, I want to receive timely notifications about booking events, so that I stay informed about my bookings and requests.

#### Acceptance Criteria

1. WHEN a booking is instantly confirmed, THE System SHALL send an email notification to the guest with booking details
2. WHEN a booking is instantly confirmed, THE System SHALL send an email notification to the owner with booking details
3. WHEN a booking request is created in Request-Based mode, THE System SHALL send an email notification to the owner
4. WHEN an owner approves a booking request, THE System SHALL send an email notification to the guest
5. WHEN an owner rejects a booking request, THE System SHALL send an email notification to the guest with a rejection reason

### Requirement 8: Data Persistence and Consistency

**User Story:** As the system, I want to maintain data consistency and persistence, so that booking information is reliable and recoverable.

#### Acceptance Criteria

1. WHEN a booking is created, THE System SHALL persist all booking details to the database atomically
2. WHEN a booking status changes, THE System SHALL update the database and maintain referential integrity
3. WHEN a property's booking mode changes, THE System SHALL persist the change and apply it to future bookings only
4. WHEN a booking is confirmed, THE System SHALL create corresponding calendar entries for all booked dates
5. WHEN a booking is cancelled or rejected, THE System SHALL remove corresponding calendar entries and maintain consistency

### Requirement 9: API Endpoints for Booking Mode Management

**User Story:** As a developer, I want clear API endpoints for managing booking modes, so that I can integrate this feature into the frontend.

#### Acceptance Criteria

1. WHEN a client sends a GET request to retrieve property details, THE System SHALL include the booking mode in the response
2. WHEN a client sends a PATCH request to update property booking mode, THE System SHALL validate the mode and persist the change
3. WHEN a client sends a POST request to create a booking, THE System SHALL process it according to the property's booking mode
4. WHEN a client sends a PATCH request to approve/reject a booking, THE System SHALL validate the owner's authorization
5. WHEN a client sends a GET request to list bookings, THE System SHALL filter by status and booking mode as requested

### Requirement 10: Error Handling and Validation

**User Story:** As the system, I want to handle errors gracefully and validate all inputs, so that the system remains stable and provides clear feedback.

#### Acceptance Criteria

1. IF an invalid booking mode is provided, THEN THE System SHALL return a 400 Bad Request error with a descriptive message
2. IF an owner attempts to approve/reject a booking they don't own, THEN THE System SHALL return a 403 Forbidden error
3. IF a booking request contains invalid dates, THEN THE System SHALL return a 400 Bad Request error
4. IF a database operation fails, THEN THE System SHALL rollback any partial changes and return a 500 Internal Server Error
5. WHEN validation fails, THE System SHALL return error messages that clearly indicate what went wrong and how to fix it
