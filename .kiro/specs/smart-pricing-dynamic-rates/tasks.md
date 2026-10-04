# Implementation Plan: Smart Pricing & Dynamic Rates

## Overview

This implementation plan breaks down the Smart Pricing & Dynamic Rates feature into discrete, incremental coding tasks. The feature will be built in layers: database schema, core pricing engine, data aggregation, rules management, history tracking, analytics, and API integration. Each task builds on previous work, with testing integrated throughout to catch errors early.

## Tasks

- [ ] 1. Set up database schema and Prisma models
  - [ ] 1.1 Create Prisma migrations for pricing tables
    - Add PricingRule, PricingPreference, PricingCalculation, PricingHistory models
    - Create indexes on propertyId, isActive, startDate, endDate, createdAt
    - _Requirements: 5.1, 7.1, 7.2_
  
  - [ ] 1.2 Generate Prisma client and verify schema
    - Run `prisma migrate dev` to apply migrations
    - Verify all models are generated correctly
    - _Requirements: 5.1_

- [ ] 2. Implement Data Aggregation Service
  - [ ] 2.1 Create booking statistics calculation
    - Implement getBookingStats() to calculate confirmed bookings in rolling window
    - Calculate 25th and 75th percentiles of booking frequency
    - Exclude cancelled bookings from counts
    - _Requirements: 1.1, 1.4_
  
  - [ ]* 2.2 Write property test for booking statistics
    - **Property 2: Confirmed Bookings Only**
    - **Validates: Requirements 1.4**
  
  - [ ] 2.3 Create occupancy rate calculation
    - Implement getOccupancyRate() to calculate occupancy for date range
    - Count only confirmed bookings
    - Calculate percentage of booked nights
    - _Requirements: 3.4_
  
  - [ ]* 2.4 Write property test for occupancy calculation
    - **Property 16: Occupancy Rate Calculation Accuracy**
    - **Validates: Requirements 3.4**
  
  - [ ] 2.5 Create competitor property identification
    - Implement findComparableProperties() using geographic proximity (5km radius)
    - Filter by similar amenities and capacity
    - _Requirements: 4.1_
  
  - [ ] 2.6 Create competitor price analysis
    - Implement calculateMedianPrice() for competitor properties
    - Calculate average, min, max prices
    - _Requirements: 4.2_
  
  - [ ]* 2.7 Write property test for competitor analysis
    - **Property 5: Competitor Price Median Calculation**
    - **Validates: Requirements 4.2**

- [ ] 3. Implement Pricing Engine Service - Core Calculations
  - [ ] 3.1 Create demand factor calculation
    - Implement calculateDemandFactor() using booking statistics
    - Apply 1.15-1.50 multiplier for high demand (>75th percentile)
    - Apply 0.80-0.95 multiplier for low demand (<25th percentile)
    - Use 1.0 default for insufficient data
    - _Requirements: 1.2, 1.3, 1.5_
  
  - [ ]* 3.2 Write property test for demand factor
    - **Property 1: Demand Factor Range Compliance**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ] 3.3 Create seasonality factor calculation
    - Implement calculateSeasonalityFactor() for holidays and peak seasons
    - Apply 1.20-1.40 for Rwanda national holidays
    - Apply 1.10-1.35 for peak seasons
    - Apply 0.85-0.95 for low seasons
    - Support custom peak seasons from preferences
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [ ]* 3.4 Write property test for seasonality factor
    - **Property 3: Seasonality Factor Composition**
    - **Validates: Requirements 2.4**
  
  - [ ] 3.5 Create occupancy factor calculation
    - Implement calculateOccupancyFactor() using occupancy rate
    - Apply 1.10-1.25 for >80% occupancy
    - Apply 1.0 for 50-80% occupancy
    - Apply 0.85-0.95 for <50% occupancy
    - Use 1.0 default for insufficient data
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [ ]* 3.6 Write property test for occupancy factor
    - **Property 4: Occupancy Threshold Mapping**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ] 3.7 Create competitor factor calculation
    - Implement calculateCompetitorFactor() using competitor analysis
    - Return 1.0 if fewer than 3 comparable properties
    - Calculate adjustment based on price comparison
    - _Requirements: 4.1, 4.5_
  
  - [ ]* 3.8 Write property test for competitor factor
    - **Property 18: Competitor Set Minimum Threshold**
    - **Validates: Requirements 4.5**

- [ ] 4. Implement Pricing Engine Service - Formula and Bounds
  - [ ] 4.1 Create custom rule application logic
    - Implement applyCustomRules() to apply pricing rules in priority order
    - Handle fixed and percentage adjustments
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ]* 4.2 Write property test for rule application
    - **Property 9: Rule Priority Ordering**
    - **Validates: Requirements 5.2**
  
  - [ ]* 4.3 Write property test for adjustment types
    - **Property 10: Fixed vs Percentage Adjustments**
    - **Validates: Requirements 5.3, 5.4**
  
  - [ ] 4.4 Create price bound enforcement
    - Implement enforceMinMaxBounds() to clamp price to min/max
    - Use min/max from preferences (default 50%-300% of base price)
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 4.5 Write property test for bound enforcement
    - **Property 6: Price Bound Enforcement**
    - **Validates: Requirements 6.2, 6.3**
  
  - [ ] 4.6 Create rounding logic
    - Implement roundToNearestHundred() to round to nearest 100 RWF
    - _Requirements: 6.4_
  
  - [ ]* 4.7 Write property test for rounding
    - **Property 7: Rounding to Nearest Hundred**
    - **Validates: Requirements 6.4**
  
  - [ ] 4.8 Create main pricing calculation algorithm
    - Implement calculateDynamicPrice() using the formula
    - Combine all factors: Base_Price × Demand × Seasonality × Occupancy × (1 + Rules)
    - Apply bounds and rounding
    - Return complete breakdown
    - _Requirements: 6.1_
  
  - [ ]* 4.9 Write property test for formula correctness
    - **Property 8: Dynamic Price Formula Correctness**
    - **Validates: Requirements 6.1**

- [ ] 5. Implement Pricing Rules Service
  - [ ] 5.1 Create pricing rule CRUD operations
    - Implement createRule(), updateRule(), deleteRule()
    - Validate rule conditions and adjustments
    - _Requirements: 5.1_
  
  - [ ] 5.2 Create rule retrieval and filtering
    - Implement getRulesForProperty() with active/inactive filtering
    - _Requirements: 5.1_
  
  - [ ] 5.3 Create rule condition evaluation
    - Implement evaluateRuleConditions() for DATE_RANGE, OCCUPANCY_THRESHOLD, DEMAND_LEVEL
    - _Requirements: 5.1_
  
  - [ ]* 5.4 Write property test for inactive rule exclusion
    - **Property 11: Inactive Rule Exclusion**
    - **Validates: Requirements 5.5**
  
  - [ ] 5.5 Create pricing preferences management
    - Implement getPreferences() and updatePreferences()
    - Store enable/disable flags for each factor
    - Store min/max price percentages
    - Store custom peak seasons
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 5.6 Write property test for disabled factor neutrality
    - **Property 12: Disabled Factor Neutrality**
    - **Validates: Requirements 9.5**
  
  - [ ] 5.7 Create manual override logic
    - Implement manual override price storage and retrieval
    - Implement override precedence in pricing calculation
    - _Requirements: 6.5_
  
  - [ ]* 5.8 Write property test for manual override precedence
    - **Property 17: Manual Override Precedence**
    - **Validates: Requirements 6.5**

- [ ] 6. Implement Pricing History and Persistence
  - [ ] 6.1 Create calculation record storage
    - Implement recordCalculation() to store pricing calculation details
    - Store all factors, breakdown, applied rules
    - _Requirements: 7.1, 7.4_
  
  - [ ]* 6.2 Write property test for calculation record completeness
    - **Property 13: Calculation Record Completeness**
    - **Validates: Requirements 7.1, 7.4**
  
  - [ ] 6.3 Create pricing history retrieval
    - Implement getHistory() with date range and property filtering
    - Implement getCalculationBreakdown() for detailed view
    - _Requirements: 7.3, 7.5_
  
  - [ ] 6.4 Create price distribution calculations
    - Implement getPriceDistribution() to calculate min, max, median, average
    - Calculate standard deviation and percentiles
    - _Requirements: 10.3_

- [ ] 7. Implement Pricing Analytics Service
  - [ ] 7.1 Create analytics report generation
    - Implement generateReport() to create comprehensive pricing report
    - Include average price, distribution, revenue comparison
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 7.2 Create revenue comparison calculation
    - Implement calculateRevenueComparison() comparing dynamic vs static pricing
    - Calculate revenue increase and percentage
    - _Requirements: 10.2_
  
  - [ ] 7.3 Create factor contribution analysis
    - Implement getFactorContribution() to analyze each factor's impact
    - Track times increased/decreased and average impact
    - _Requirements: 10.4_
  
  - [ ] 7.4 Create top performing rules analysis
    - Implement getTopPerformingRules() to identify most-used rules
    - _Requirements: 10.4_
  
  - [ ]* 7.5 Write property test for analytics period coverage
    - **Property 15: Analytics Period Coverage**
    - **Validates: Requirements 10.5**

- [ ] 8. Implement Notification Integration
  - [ ] 8.1 Create price change notification logic
    - Implement notifyPriceChange() to alert owners of significant changes
    - Check 10% threshold before notifying
    - Include old price, new price, reason
    - _Requirements: 8.5_
  
  - [ ]* 8.2 Write property test for notification threshold
    - **Property 14: Price Change Notification Threshold**
    - **Validates: Requirements 8.5**
  
  - [ ] 8.3 Integrate with existing notification service
    - Use NotificationService to send notifications
    - Create PRICE_CHANGE notification type if needed
    - _Requirements: 8.5_

- [ ] 9. Implement API Routes and Controllers
  - [ ] 9.1 Create pricing calculation endpoint
    - POST /api/pricing/calculate
    - Accept propertyId, startDate, endDate
    - Return dynamic price and breakdown
    - _Requirements: 6.1_
  
  - [ ] 9.2 Create pricing rules endpoints
    - POST /api/pricing/rules (create)
    - GET /api/pricing/rules/:propertyId (list)
    - PUT /api/pricing/rules/:ruleId (update)
    - DELETE /api/pricing/rules/:ruleId (delete)
    - _Requirements: 5.1_
  
  - [ ] 9.3 Create pricing preferences endpoints
    - GET /api/pricing/preferences/:propertyId
    - PUT /api/pricing/preferences/:propertyId
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 9.4 Create pricing history endpoints
    - GET /api/pricing/history/:propertyId
    - GET /api/pricing/history/:propertyId/:recordId
    - Support date range filtering
    - _Requirements: 7.3, 7.5_
  
  - [ ] 9.5 Create pricing analytics endpoints
    - GET /api/pricing/analytics/:propertyId
    - Accept startDate, endDate parameters
    - Return comprehensive analytics report
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 9.6 Add input validation and error handling
    - Validate date ranges
    - Validate price bounds
    - Validate rule conditions
    - Return appropriate error responses
    - _Requirements: All_

- [ ] 10. Implement Real-Time Price Updates
  - [ ] 10.1 Create booking confirmation hook
    - Trigger price recalculation when booking is confirmed
    - Update prices for affected date ranges
    - _Requirements: 8.1_
  
  - [ ] 10.2 Create booking cancellation hook
    - Trigger price recalculation when booking is cancelled
    - Update prices for freed date ranges
    - _Requirements: 8.2_
  
  - [ ] 10.3 Create competitor property addition hook
    - Trigger price recalculation when new competitor is added
    - Update prices for affected properties
    - _Requirements: 8.3_
  
  - [ ] 10.4 Create price update batch job
    - Implement scheduled job to recalculate prices
    - Update all future bookings within 5 minutes
    - _Requirements: 8.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass (minimum 100 iterations each)
  - Ensure all integration tests pass
  - Ask the user if questions arise

- [ ] 12. Create React components for pricing management
  - [ ] 12.1 Create pricing rules management component
    - Display list of pricing rules
    - Allow create, edit, delete operations
    - Show rule conditions and adjustments
    - _Requirements: 5.1_
  
  - [ ] 12.2 Create pricing preferences configuration component
    - Display enable/disable toggles for each factor
    - Allow setting min/max price percentages
    - Allow configuring custom peak seasons
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 12.3 Create pricing history viewer component
    - Display pricing calculation history
    - Show calculation breakdown for each record
    - Allow filtering by date range
    - _Requirements: 7.3, 7.5_
  
  - [ ] 12.4 Create pricing analytics dashboard component
    - Display average price and distribution
    - Show revenue comparison (dynamic vs static)
    - Display factor contribution analysis
    - Show top performing rules
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 13. Integration testing and validation
  - [ ] 13.1 Test end-to-end pricing workflow
    - Create property with pricing preferences
    - Create pricing rules
    - Calculate dynamic price
    - Verify calculation is stored
    - Verify history is retrievable
    - _Requirements: All_
  
  - [ ] 13.2 Test real-time price updates
    - Create booking and verify price recalculation
    - Cancel booking and verify price recalculation
    - Add competitor property and verify price recalculation
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 13.3 Test notification integration
    - Verify price change notifications are sent
    - Verify notification content is correct
    - Verify notification threshold is respected
    - _Requirements: 8.5_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure all integration tests pass
  - Verify all requirements are covered
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All code should follow existing project patterns (TypeScript, Express, Prisma)
- Use RWF (Rwandan Franc) as the primary currency
- Include Rwanda national holidays in seasonality calculations
- Test with realistic Rwanda property data and pricing ranges

