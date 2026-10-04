# Design Document: Smart Pricing & Dynamic Rates

## Overview

The Smart Pricing & Dynamic Rates feature implements a sophisticated pricing engine that automatically adjusts rental prices based on real-time market conditions. The system combines multiple pricing factors (demand, seasonality, occupancy, competitor analysis) using a unified algorithm to calculate optimal prices that maximize revenue while maintaining market competitiveness.

The architecture separates concerns into distinct layers:
- **Pricing Engine**: Core calculation logic for dynamic prices
- **Data Layer**: Historical data aggregation and competitor analysis
- **Configuration Layer**: Pricing rules and preferences management
- **Notification Layer**: Real-time price change alerts
- **Analytics Layer**: Pricing performance reporting

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Pricing API Layer                         │
│  (Routes: /pricing/calculate, /pricing/rules, /pricing/config)
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼──────────┐
│ Pricing Engine   │    │ Configuration     │
│ Service          │    │ Service           │
│                  │    │                   │
│ • Calculate      │    │ • Manage rules    │
│ • Apply factors  │    │ • Store prefs     │
│ • Enforce bounds │    │ • Validate config │
└────────┬─────────┘    └────────┬──────────┘
         │                       │
    ┌────┴───────────────────────┴────┐
    │                                 │
┌───▼──────────────┐    ┌────────────▼──┐
│ Data Aggregation │    │ Notification  │
│ Service          │    │ Service       │
│                  │    │               │
│ • Demand calc    │    │ • Alert owner │
│ • Occupancy calc │    │ • Log changes │
│ • Competitor     │    │ • Audit trail │
│   analysis       │    │               │
└────────┬─────────┘    └───────────────┘
         │
    ┌────▼──────────────────────────┐
    │   Database Layer (Prisma)     │
    │                               │
    │ • PricingCalculation          │
    │ • PricingRule                 │
    │ • PricingPreference           │
    │ • PricingHistory              │
    └───────────────────────────────┘
```

### Data Flow

1. **Price Calculation Request**: Property owner or system requests price calculation for a date range
2. **Data Aggregation**: System gathers historical bookings, competitor data, and configuration
3. **Factor Calculation**: Each pricing factor (demand, seasonality, occupancy, competitor) is calculated independently
4. **Algorithm Application**: Factors are combined using the unified formula
5. **Bounds Enforcement**: Final price is clamped to min/max bounds
6. **Persistence**: Calculation details are stored for audit and analytics
7. **Notification**: Owner is notified of significant price changes
8. **Application**: Price is applied to future bookings

## Components and Interfaces

### 1. Pricing Engine Service

**Responsibility**: Core pricing calculation logic

```typescript
interface PricingFactors {
  demandFactor: number;
  seasonalityFactor: number;
  occupancyFactor: number;
  competitorFactor: number;
  customRuleAdjustments: number;
}

interface PricingCalculationInput {
  propertyId: number;
  startDate: Date;
  endDate: Date;
  basePrice: number;
  preferences: PricingPreferences;
  rules: PricingRule[];
}

interface PricingCalculationResult {
  dynamicPrice: number;
  factors: PricingFactors;
  breakdown: PricingBreakdown;
  appliedRules: PricingRule[];
  timestamp: Date;
}

interface PricingBreakdown {
  basePrice: number;
  afterDemand: number;
  afterSeasonality: number;
  afterOccupancy: number;
  afterCompetitor: number;
  afterRules: number;
  finalPrice: number;
  minBound: number;
  maxBound: number;
}

class PricingEngineService {
  async calculateDynamicPrice(input: PricingCalculationInput): Promise<PricingCalculationResult>
  private calculateDemandFactor(propertyId: number, startDate: Date, endDate: Date): Promise<number>
  private calculateSeasonalityFactor(startDate: Date, endDate: Date, customSeasons?: PeakSeason[]): number
  private calculateOccupancyFactor(propertyId: number, startDate: Date, endDate: Date): Promise<number>
  private calculateCompetitorFactor(propertyId: number, startDate: Date, endDate: Date): Promise<number>
  private applyCustomRules(basePrice: number, rules: PricingRule[], startDate: Date, endDate: Date): number
  private enforceMinMaxBounds(price: number, basePrice: number): number
  private roundToNearestHundred(price: number): number
}
```

### 2. Data Aggregation Service

**Responsibility**: Gather and calculate pricing factors from historical data

```typescript
interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  percentile25: number;
  percentile75: number;
  averageBookingsPerDay: number;
}

interface OccupancyData {
  totalNights: number;
  bookedNights: number;
  occupancyRate: number;
}

interface CompetitorAnalysis {
  comparableProperties: Property[];
  medianPrice: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceComparison: {
    percentageAboveMedian: number;
    percentageBelowMedian: number;
    flag: 'OVERPRICED' | 'UNDERPRICED' | 'COMPETITIVE' | null;
  };
}

class DataAggregationService {
  async getBookingStats(propertyId: number, windowDays: number = 30): Promise<BookingStats>
  async getOccupancyRate(propertyId: number, startDate: Date, endDate: Date): Promise<OccupancyData>
  async getCompetitorAnalysis(propertyId: number, startDate: Date, endDate: Date): Promise<CompetitorAnalysis>
  private findComparableProperties(propertyId: number, radiusKm: number = 5): Promise<Property[]>
  private calculateMedianPrice(properties: Property[], startDate: Date, endDate: Date): Promise<number>
}
```

### 3. Pricing Rules Service

**Responsibility**: Manage custom pricing rules and preferences

```typescript
interface PricingRule {
  id: number;
  propertyId: number;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  conditions: RuleCondition[];
  adjustment: PriceAdjustment;
  createdAt: Date;
  updatedAt: Date;
}

interface RuleCondition {
  type: 'DATE_RANGE' | 'OCCUPANCY_THRESHOLD' | 'DEMAND_LEVEL' | 'CUSTOM';
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN';
  value: string | number | string[];
}

interface PriceAdjustment {
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  minPrice?: number;
  maxPrice?: number;
}

interface PricingPreferences {
  propertyId: number;
  enableDemandPricing: boolean;
  enableSeasonalityPricing: boolean;
  enableOccupancyPricing: boolean;
  enableCompetitorPricing: boolean;
  minPricePercentage: number; // e.g., 0.5 for 50% of base price
  maxPricePercentage: number; // e.g., 3.0 for 300% of base price
  customPeakSeasons?: PeakSeason[];
  manualOverridePrice?: number;
  manualOverrideUntil?: Date;
}

interface PeakSeason {
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  multiplier: number;
}

class PricingRulesService {
  async createRule(propertyId: number, rule: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PricingRule>
  async updateRule(ruleId: number, updates: Partial<PricingRule>): Promise<PricingRule>
  async deleteRule(ruleId: number): Promise<void>
  async getRulesForProperty(propertyId: number): Promise<PricingRule[]>
  async getPreferences(propertyId: number): Promise<PricingPreferences>
  async updatePreferences(propertyId: number, preferences: Partial<PricingPreferences>): Promise<PricingPreferences>
  async evaluateRuleConditions(rule: PricingRule, context: RuleEvaluationContext): Promise<boolean>
}

interface RuleEvaluationContext {
  startDate: Date;
  endDate: Date;
  occupancyRate: number;
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

### 4. Pricing History Service

**Responsibility**: Store and retrieve pricing calculation history

```typescript
interface PricingCalculationRecord {
  id: number;
  propertyId: number;
  startDate: Date;
  endDate: Date;
  basePrice: number;
  dynamicPrice: number;
  factors: PricingFactors;
  breakdown: PricingBreakdown;
  appliedRules: number[]; // Rule IDs
  appliedManualOverride: boolean;
  createdAt: Date;
}

interface PricingHistoryQuery {
  propertyId: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class PricingHistoryService {
  async recordCalculation(record: Omit<PricingCalculationRecord, 'id' | 'createdAt'>): Promise<PricingCalculationRecord>
  async getHistory(query: PricingHistoryQuery): Promise<PricingCalculationRecord[]>
  async getCalculationBreakdown(recordId: number): Promise<PricingCalculationRecord>
  async getAveragePrice(propertyId: number, startDate: Date, endDate: Date): Promise<number>
  async getPriceDistribution(propertyId: number, startDate: Date, endDate: Date): Promise<PriceDistribution>
}

interface PriceDistribution {
  min: number;
  max: number;
  median: number;
  average: number;
  standardDeviation: number;
  percentiles: Record<number, number>;
}
```

### 5. Pricing Analytics Service

**Responsibility**: Generate pricing performance reports

```typescript
interface PricingAnalyticsReport {
  propertyId: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  averagePrice: number;
  priceDistribution: PriceDistribution;
  revenueComparison: {
    dynamicPricingRevenue: number;
    staticPricingRevenue: number;
    revenueIncrease: number;
    revenueIncreasePercentage: number;
  };
  factorContribution: {
    demandFactor: FactorContribution;
    seasonalityFactor: FactorContribution;
    occupancyFactor: FactorContribution;
    competitorFactor: FactorContribution;
    customRules: FactorContribution;
  };
  topAppliedRules: Array<{
    ruleId: number;
    ruleName: string;
    timesApplied: number;
    averageImpact: number;
  }>;
}

interface FactorContribution {
  timesIncreased: number;
  timesDecreased: number;
  averageIncrease: number;
  averageDecrease: number;
  netImpact: number;
}

class PricingAnalyticsService {
  async generateReport(propertyId: number, startDate: Date, endDate: Date): Promise<PricingAnalyticsReport>
  async calculateRevenueComparison(propertyId: number, startDate: Date, endDate: Date): Promise<RevenueComparison>
  async getFactorContribution(propertyId: number, startDate: Date, endDate: Date): Promise<Record<string, FactorContribution>>
  async getTopPerformingRules(propertyId: number, limit: number = 5): Promise<Array<{ruleId: number; ruleName: string; timesApplied: number}>>
}

interface RevenueComparison {
  dynamicPricingRevenue: number;
  staticPricingRevenue: number;
  revenueIncrease: number;
  revenueIncreasePercentage: number;
}
```

### 6. Notification Service Integration

**Responsibility**: Alert owners of significant price changes

```typescript
interface PriceChangeNotification {
  propertyId: number;
  ownerId: number;
  oldPrice: number;
  newPrice: number;
  changePercentage: number;
  affectedDates: {
    startDate: Date;
    endDate: Date;
  };
  reason: string; // e.g., "High demand detected"
  timestamp: Date;
}

class PricingNotificationService {
  async notifyPriceChange(notification: PriceChangeNotification): Promise<void>
  private shouldNotify(changePercentage: number, threshold: number = 0.1): boolean
}
```

## Data Models

### Database Schema Extensions

```prisma
model PricingRule {
  id              Int       @id @default(autoincrement())
  propertyId      Int       @map("property_id")
  name            String
  description     String?   @db.Text
  priority        Int       @default(0)
  isActive        Boolean   @default(true) @map("is_active")
  conditions      Json      // Array of RuleCondition
  adjustment      Json      // PriceAdjustment object
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  property        Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([propertyId])
  @@index([isActive])
  @@map("pricing_rules")
}

model PricingPreference {
  id                      Int       @id @default(autoincrement())
  propertyId              Int       @unique @map("property_id")
  enableDemandPricing     Boolean   @default(true) @map("enable_demand_pricing")
  enableSeasonalityPricing Boolean  @default(true) @map("enable_seasonality_pricing")
  enableOccupancyPricing  Boolean   @default(true) @map("enable_occupancy_pricing")
  enableCompetitorPricing Boolean   @default(true) @map("enable_competitor_pricing")
  minPricePercentage      Float     @default(0.5) @map("min_price_percentage")
  maxPricePercentage      Float     @default(3.0) @map("max_price_percentage")
  customPeakSeasons       Json?     @map("custom_peak_seasons") // Array of PeakSeason
  manualOverridePrice     Float?    @map("manual_override_price")
  manualOverrideUntil     DateTime? @map("manual_override_until")
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")

  property                Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@map("pricing_preferences")
}

model PricingCalculation {
  id                      Int       @id @default(autoincrement())
  propertyId              Int       @map("property_id")
  startDate               DateTime  @map("start_date")
  endDate                 DateTime  @map("end_date")
  basePrice               Float     @map("base_price")
  dynamicPrice            Float     @map("dynamic_price")
  factors                 Json      // PricingFactors object
  breakdown               Json      // PricingBreakdown object
  appliedRules            Json      @map("applied_rules") // Array of rule IDs
  appliedManualOverride   Boolean   @default(false) @map("applied_manual_override")
  createdAt               DateTime  @default(now()) @map("created_at")

  property                Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([propertyId])
  @@index([startDate, endDate])
  @@index([createdAt])
  @@map("pricing_calculations")
}

model PricingHistory {
  id                      Int       @id @default(autoincrement())
  bookingId               Int       @unique @map("booking_id")
  propertyId              Int       @map("property_id")
  appliedPrice            Float     @map("applied_price")
  calculationId           Int?      @map("calculation_id")
  appliedAt               DateTime  @default(now()) @map("applied_at")

  booking                 Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  property                Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([propertyId])
  @@index([appliedAt])
  @@map("pricing_history")
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Demand Factor Range Compliance

*For any* booking window with historical booking data, the calculated demand factor SHALL fall within the valid range [0.80, 1.50], with high-demand scenarios producing factors ≥ 1.15 and low-demand scenarios producing factors ≤ 0.95.

**Validates: Requirements 1.2, 1.3**

### Property 2: Confirmed Bookings Only

*For any* property with mixed booking statuses (confirmed, pending, cancelled), the demand calculation SHALL only count confirmed bookings and exclude all cancelled or pending bookings.

**Validates: Requirements 1.4**

### Property 3: Seasonality Factor Composition

*For any* booking window with multiple overlapping seasonal factors (holiday + peak season), the combined seasonality factor SHALL equal the product of individual factors, not their sum.

**Validates: Requirements 2.4**

### Property 4: Occupancy Threshold Mapping

*For any* occupancy rate, the occupancy multiplier SHALL map correctly: occupancy > 80% → [1.10, 1.25], 50% ≤ occupancy ≤ 80% → 1.0, occupancy < 50% → [0.85, 0.95].

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Competitor Price Median Calculation

*For any* set of competitor properties with available prices, the calculated median competitor price SHALL be the middle value when prices are sorted, or the average of two middle values for even-sized sets.

**Validates: Requirements 4.2**

### Property 6: Price Bound Enforcement

*For any* calculated dynamic price that violates min/max bounds, the final price SHALL be clamped to the nearest bound (min or max), never exceeding the bounds.

**Validates: Requirements 6.2, 6.3**

### Property 7: Rounding to Nearest Hundred

*For any* calculated price, the final price SHALL be rounded to the nearest 100 RWF, with prices ending in 50 or more rounding up and prices ending in less than 50 rounding down.

**Validates: Requirements 6.4**

### Property 8: Dynamic Price Formula Correctness

*For any* set of pricing factors and base price, the calculated dynamic price SHALL equal Base_Price × Demand_Factor × Seasonality_Factor × Occupancy_Factor × (1 + Custom_Rule_Adjustments), before bounds enforcement and rounding.

**Validates: Requirements 6.1**

### Property 9: Rule Priority Ordering

*For any* set of pricing rules with different priorities, when multiple rules apply to the same booking window, they SHALL be applied in descending priority order, with higher-priority rules applied first.

**Validates: Requirements 5.2**

### Property 10: Fixed vs Percentage Adjustments

*For any* pricing rule with a fixed adjustment, the adjustment SHALL be added/subtracted directly from the price. For percentage adjustments, the price SHALL be multiplied by (1 + percentage).

**Validates: Requirements 5.3, 5.4**

### Property 11: Inactive Rule Exclusion

*For any* pricing rule marked as inactive, that rule SHALL NOT be applied to any price calculations, regardless of whether its conditions match.

**Validates: Requirements 5.5**

### Property 12: Disabled Factor Neutrality

*For any* pricing factor that is disabled in preferences, that factor SHALL contribute a multiplier of 1.0 to the final price calculation, effectively neutralizing its impact.

**Validates: Requirements 9.5**

### Property 13: Calculation Record Completeness

*For any* price calculation, the stored record SHALL include all factors (demand, seasonality, occupancy, competitor), the complete breakdown showing price at each step, and all applied rules.

**Validates: Requirements 7.1, 7.4**

### Property 14: Price Change Notification Threshold

*For any* price change, the system SHALL notify the property owner if and only if the change percentage exceeds 10%, with the notification including the old price, new price, and reason for change.

**Validates: Requirements 8.5**

### Property 15: Analytics Period Coverage

*For any* analytics report request, the report SHALL include data from at least the last 90 days of pricing calculations, with complete coverage of all properties and date ranges within that period.

**Validates: Requirements 10.5**

### Property 16: Occupancy Rate Calculation Accuracy

*For any* date range, the occupancy rate SHALL be calculated as (confirmed_booked_nights / total_available_nights) × 100, excluding pending and cancelled bookings from the numerator.

**Validates: Requirements 3.4**

### Property 17: Manual Override Precedence

*For any* booking with a manual override price set, the system SHALL use the manual override price instead of any calculated dynamic price, regardless of other factors.

**Validates: Requirements 6.5**

### Property 18: Competitor Set Minimum Threshold

*For any* competitor analysis, if fewer than 3 comparable properties exist in the geographic area, the system SHALL NOT apply competitor-based price adjustments and SHALL flag this in the calculation record.

**Validates: Requirements 4.5**

### Property 19: Insufficient Data Default Factors

*For any* pricing factor calculation with insufficient historical data (< 30 days for demand, < 30 days for occupancy), the system SHALL use a default multiplier of 1.0 for that factor.

**Validates: Requirements 1.5, 3.5**

### Property 20: Price Comparison Flagging

*For any* calculated dynamic price compared to median competitor price, the system SHALL flag as 'OVERPRICED' if > 20% above median, 'UNDERPRICED' if > 20% below median, or 'COMPETITIVE' if within ±20%.

**Validates: Requirements 4.3, 4.4**

## Error Handling

### Pricing Calculation Errors

1. **Insufficient Data**: When historical data is insufficient, use default multipliers (1.0) rather than failing
2. **Invalid Date Range**: Validate that start date < end date and both are in the future
3. **Property Not Found**: Return 404 with clear error message
4. **Competitor Data Unavailable**: Gracefully degrade by skipping competitor factor (use 1.0)
5. **Rule Evaluation Failure**: Log error and skip the rule, continue with other rules

### Configuration Errors

1. **Invalid Bounds**: Validate that min_price_percentage < max_price_percentage
2. **Invalid Rule Conditions**: Validate condition syntax and values before storing
3. **Circular Rule Dependencies**: Detect and prevent rules that reference each other
4. **Invalid Adjustment Values**: Ensure percentage adjustments are reasonable (e.g., -100% to +500%)

### Data Consistency Errors

1. **Stale Competitor Data**: If competitor data is older than 7 days, flag as potentially stale
2. **Missing Booking Data**: If booking data is incomplete, log warning and use available data
3. **Concurrent Calculation Conflicts**: Use database transactions to ensure consistency

## Testing Strategy

### Unit Tests

**Pricing Engine Calculations**:
- Test demand factor calculation with various booking frequencies
- Test seasonality factor calculation with holidays and peak seasons
- Test occupancy factor calculation with different occupancy rates
- Test competitor factor calculation with various competitor prices
- Test custom rule application with fixed and percentage adjustments
- Test price bound enforcement and clamping
- Test rounding to nearest 100 RWF
- Test formula correctness with known inputs and expected outputs

**Data Aggregation**:
- Test booking statistics calculation with mixed booking statuses
- Test occupancy rate calculation with various booking patterns
- Test competitor property identification by geographic proximity
- Test median price calculation with various competitor prices

**Rules Management**:
- Test rule creation, update, and deletion
- Test rule priority ordering
- Test rule condition evaluation
- Test preference storage and retrieval

**Analytics**:
- Test revenue comparison calculations
- Test factor contribution analysis
- Test price distribution calculations
- Test report generation with various data sets

### Property-Based Tests

**Property 1: Demand Factor Range Compliance**
- Generate random booking frequencies
- Verify demand factor falls within [0.80, 1.50]
- Verify high-demand scenarios produce factors ≥ 1.15
- Verify low-demand scenarios produce factors ≤ 0.95

**Property 2: Confirmed Bookings Only**
- Generate random booking statuses
- Verify only confirmed bookings are counted
- Verify cancelled and pending bookings are excluded

**Property 3: Seasonality Factor Composition**
- Generate overlapping seasonal factors
- Verify combined factor equals product of individual factors

**Property 4: Occupancy Threshold Mapping**
- Generate random occupancy rates
- Verify correct multiplier for each occupancy range

**Property 6: Price Bound Enforcement**
- Generate prices that violate bounds
- Verify prices are clamped to nearest bound

**Property 7: Rounding to Nearest Hundred**
- Generate random prices
- Verify rounding to nearest 100 RWF

**Property 8: Dynamic Price Formula Correctness**
- Generate random factors and base prices
- Verify formula calculation matches expected result

**Property 9: Rule Priority Ordering**
- Generate multiple rules with different priorities
- Verify rules are applied in correct order

**Property 10: Fixed vs Percentage Adjustments**
- Generate rules with fixed and percentage adjustments
- Verify correct calculation for each type

**Property 12: Disabled Factor Neutrality**
- Generate calculations with disabled factors
- Verify disabled factors contribute 1.0 multiplier

**Property 14: Price Change Notification Threshold**
- Generate price changes of various magnitudes
- Verify notifications only for changes > 10%

**Property 16: Occupancy Rate Calculation Accuracy**
- Generate random booking patterns
- Verify occupancy rate calculation accuracy

**Property 17: Manual Override Precedence**
- Generate calculations with manual overrides
- Verify manual override price is used

**Property 20: Price Comparison Flagging**
- Generate prices relative to competitor median
- Verify correct flagging (OVERPRICED, UNDERPRICED, COMPETITIVE)

### Integration Tests

**End-to-End Pricing Workflow**:
- Create property with pricing preferences
- Create pricing rules
- Calculate dynamic price
- Verify calculation is stored
- Verify history is retrievable
- Verify analytics are generated

**Real-Time Price Updates**:
- Create booking and verify price recalculation
- Cancel booking and verify price recalculation
- Add competitor property and verify price recalculation

**Notification Integration**:
- Verify price change notifications are sent
- Verify notification content is correct
- Verify notification threshold is respected

### Test Configuration

- **Minimum 100 iterations** per property-based test
- **Mock external services** (competitor data, notifications) to keep tests fast
- **Use realistic Rwanda pricing data** (RWF currency, local holidays)
- **Test with various property types** (apartments, houses, villas)
- **Include edge cases** (single-day bookings, year-end holidays, extreme occupancy rates)

