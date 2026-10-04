# Requirements Document: Smart Pricing & Dynamic Rates

## Introduction

The Smart Pricing & Dynamic Rates feature enables property owners on the Rwanda-focused rental platform to automatically adjust rental prices based on real-time market conditions. This system analyzes demand patterns, seasonal trends, occupancy rates, and competitor pricing to recommend or apply dynamic pricing adjustments. The feature helps property owners maximize revenue while remaining competitive in the market.

## Glossary

- **Base_Price**: The standard nightly rate set by the property owner
- **Dynamic_Price**: The adjusted price calculated by the pricing engine based on market conditions
- **Demand_Factor**: A multiplier derived from booking frequency in similar date ranges
- **Seasonality_Factor**: A multiplier based on holidays, peak seasons, and historical trends
- **Occupancy_Rate**: The percentage of available nights that are booked for a property
- **Competitor_Price**: The average nightly rate of competing properties in the same area
- **Pricing_Rule**: A configuration that defines conditions and price adjustments
- **Price_Adjustment**: The percentage or fixed amount change applied to the base price
- **Booking_Window**: A date range for which pricing is being calculated
- **Rwanda_Holiday**: A recognized national or regional holiday in Rwanda
- **Peak_Season**: A period of high demand (e.g., holiday season, tourism season)
- **Pricing_Engine**: The system component that calculates dynamic prices
- **Property_Owner**: A user who manages rental properties
- **Competitor_Set**: A group of similar properties used for price comparison

## Requirements

### Requirement 1: Demand-Based Pricing Calculation

**User Story:** As a property owner, I want prices to increase when demand is high and decrease when demand is low, so that I can maximize revenue during peak periods and remain competitive during slow periods.

#### Acceptance Criteria

1. WHEN calculating demand for a booking window, THE Pricing_Engine SHALL analyze all bookings for the same property within a 30-day rolling window
2. WHEN the number of bookings in the rolling window exceeds the 75th percentile of historical booking frequency, THE Pricing_Engine SHALL apply a demand multiplier of 1.15 to 1.50
3. WHEN the number of bookings in the rolling window falls below the 25th percentile of historical booking frequency, THE Pricing_Engine SHALL apply a demand multiplier of 0.80 to 0.95
4. WHEN calculating demand, THE Pricing_Engine SHALL exclude cancelled bookings and only count confirmed bookings
5. WHEN demand data is insufficient (fewer than 30 days of historical data), THE Pricing_Engine SHALL use a default demand multiplier of 1.0

### Requirement 2: Seasonality-Based Pricing

**User Story:** As a property owner, I want prices to automatically adjust for holidays and peak seasons, so that I can capture higher revenue during high-demand periods.

#### Acceptance Criteria

1. WHEN a booking window includes a Rwanda national holiday, THE Pricing_Engine SHALL apply a seasonality multiplier of 1.20 to 1.40
2. WHEN a booking window falls within a defined peak season (e.g., December 15 - January 5, July 15 - August 31), THE Pricing_Engine SHALL apply a seasonality multiplier of 1.10 to 1.35
3. WHEN a booking window includes a low season period, THE Pricing_Engine SHALL apply a seasonality multiplier of 0.85 to 0.95
4. WHEN multiple seasonal factors apply to the same booking window, THE Pricing_Engine SHALL combine them using multiplication (not addition)
5. WHEN a property owner configures custom peak seasons, THE Pricing_Engine SHALL use those dates instead of default peak seasons

### Requirement 3: Occupancy-Based Pricing

**User Story:** As a property owner, I want prices to adjust based on how booked my property is, so that I can optimize occupancy and revenue.

#### Acceptance Criteria

1. WHEN the occupancy rate for the next 30 days is above 80%, THE Pricing_Engine SHALL apply an occupancy multiplier of 1.10 to 1.25
2. WHEN the occupancy rate for the next 30 days is between 50% and 80%, THE Pricing_Engine SHALL apply an occupancy multiplier of 1.0 (no adjustment)
3. WHEN the occupancy rate for the next 30 days is below 50%, THE Pricing_Engine SHALL apply an occupancy multiplier of 0.85 to 0.95
4. WHEN calculating occupancy rate, THE Pricing_Engine SHALL count only confirmed bookings and exclude pending or cancelled bookings
5. WHEN occupancy data is insufficient, THE Pricing_Engine SHALL use a default occupancy multiplier of 1.0

### Requirement 4: Competitor Price Analysis

**User Story:** As a property owner, I want to see how my prices compare to similar properties, so that I can remain competitive without losing revenue.

#### Acceptance Criteria

1. WHEN analyzing competitor pricing, THE Pricing_Engine SHALL identify properties in the same geographic area (within 5km radius) with similar amenities and capacity
2. WHEN competitor prices are available, THE Pricing_Engine SHALL calculate the median competitor price for the booking window
3. WHEN the property's dynamic price is more than 20% above the median competitor price, THE Pricing_Engine SHALL flag this as a potential pricing issue
4. WHEN the property's dynamic price is more than 20% below the median competitor price, THE Pricing_Engine SHALL flag this as a potential revenue opportunity
5. WHEN insufficient competitor data exists (fewer than 3 comparable properties), THE Pricing_Engine SHALL not apply competitor-based adjustments

### Requirement 5: Pricing Rules Management

**User Story:** As a property owner, I want to define custom pricing rules, so that I can implement business logic specific to my property.

#### Acceptance Criteria

1. WHEN a property owner creates a pricing rule, THE System SHALL store the rule with conditions (date ranges, occupancy thresholds, demand levels) and price adjustments
2. WHEN multiple pricing rules apply to the same booking window, THE System SHALL apply them in priority order (highest priority first)
3. WHEN a pricing rule specifies a fixed price adjustment, THE System SHALL add or subtract that amount from the base price
4. WHEN a pricing rule specifies a percentage adjustment, THE System SHALL multiply the current price by that percentage
5. WHEN a pricing rule is marked as inactive, THE System SHALL not apply it to price calculations

### Requirement 6: Dynamic Price Calculation Algorithm

**User Story:** As a system architect, I want a clear algorithm for combining multiple pricing factors, so that the final price is predictable and fair.

#### Acceptance Criteria

1. THE Pricing_Engine SHALL calculate the final dynamic price using the formula: Dynamic_Price = Base_Price × Demand_Factor × Seasonality_Factor × Occupancy_Factor × (1 + Custom_Rule_Adjustments)
2. WHEN calculating the final price, THE Pricing_Engine SHALL enforce minimum and maximum price bounds (e.g., no lower than 50% of base price, no higher than 300% of base price)
3. WHEN the calculated price violates the bounds, THE Pricing_Engine SHALL clamp the price to the nearest bound
4. WHEN calculating prices, THE Pricing_Engine SHALL round the final price to the nearest 100 RWF (Rwandan Franc)
5. WHEN a property owner sets a manual override price, THE System SHALL use that price instead of the calculated dynamic price

### Requirement 7: Price Calculation Persistence and History

**User Story:** As a property owner, I want to see the history of price calculations, so that I can understand how prices were determined.

#### Acceptance Criteria

1. WHEN a dynamic price is calculated, THE System SHALL store the calculation details including all factors and their values
2. WHEN a price is applied to a booking, THE System SHALL record the applied price and the calculation timestamp
3. WHEN a property owner views pricing history, THE System SHALL display the calculation breakdown for each price change
4. WHEN a price calculation is performed, THE System SHALL include the demand factor, seasonality factor, occupancy factor, and any applied rules in the stored record
5. WHEN querying historical prices, THE System SHALL allow filtering by date range and property

### Requirement 8: Real-Time Price Updates

**User Story:** As a property owner, I want prices to update automatically as market conditions change, so that I don't have to manually adjust prices.

#### Acceptance Criteria

1. WHEN a new booking is confirmed, THE System SHALL recalculate prices for affected date ranges
2. WHEN a booking is cancelled, THE System SHALL recalculate prices for the freed date ranges
3. WHEN a new competitor property is added to the market, THE System SHALL recalculate prices for affected properties
4. WHEN the system recalculates prices, THE System SHALL update prices for all future bookings (not yet started) within 5 minutes
5. WHEN a price update occurs, THE System SHALL notify the property owner of significant price changes (>10% change)

### Requirement 9: Pricing Configuration and Preferences

**User Story:** As a property owner, I want to configure which pricing factors to use, so that I can control how my prices are calculated.

#### Acceptance Criteria

1. WHEN a property owner configures pricing preferences, THE System SHALL allow enabling/disabling demand-based pricing
2. WHEN a property owner configures pricing preferences, THE System SHALL allow enabling/disabling seasonality-based pricing
3. WHEN a property owner configures pricing preferences, THE System SHALL allow enabling/disabling occupancy-based pricing
4. WHEN a property owner configures pricing preferences, THE System SHALL allow enabling/disabling competitor-based pricing
5. WHEN a pricing factor is disabled, THE System SHALL use a multiplier of 1.0 for that factor in calculations

### Requirement 10: Pricing Analytics and Reporting

**User Story:** As a property owner, I want to see analytics on pricing performance, so that I can understand the impact of dynamic pricing on revenue.

#### Acceptance Criteria

1. WHEN a property owner views pricing analytics, THE System SHALL display the average dynamic price over a selected period
2. WHEN a property owner views pricing analytics, THE System SHALL display the revenue impact compared to static pricing
3. WHEN a property owner views pricing analytics, THE System SHALL show the distribution of prices applied (min, max, median, average)
4. WHEN a property owner views pricing analytics, THE System SHALL display how often each pricing factor contributed to price increases or decreases
5. WHEN generating analytics reports, THE System SHALL include data for at least the last 90 days

