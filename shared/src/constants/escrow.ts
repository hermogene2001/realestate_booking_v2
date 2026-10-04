export const ESCROW_STATES = ['Created', 'Locked', 'Completed', 'Refunded', 'Disputed', 'Cancelled'] as const;

export const PLATFORM_FEE_BPS = 250; // 2.5%
export const MAX_PLATFORM_FEE_BPS = 1000; // 10%
export const CANCELLATION_PENALTY_BPS = 1000; // 10%
export const DEFAULT_TIMEOUT_SECONDS = 30 * 24 * 60 * 60; // 30 days
