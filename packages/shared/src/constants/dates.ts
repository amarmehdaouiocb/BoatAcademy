/**
 * Default timezone
 */
export const DEFAULT_TIMEZONE = 'Europe/Paris';

/**
 * Default access duration in days (12 months)
 */
export const DEFAULT_ACCESS_DURATION_DAYS = 365;

/**
 * Late cancellation threshold in hours
 */
export const LATE_CANCEL_THRESHOLD_HOURS = 24;

/**
 * Check if cancellation is late (less than 24h before session)
 */
export function isLateCancellation(sessionStartsAt: Date, cancelledAt: Date = new Date()): boolean {
  const hoursUntilSession = (sessionStartsAt.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);
  return hoursUntilSession < LATE_CANCEL_THRESHOLD_HOURS;
}

/**
 * Format date for display (French locale)
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format time for display (French locale)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} a ${formatTime(date)}`;
}

/**
 * Check if entitlement is expired
 */
export function isEntitlementExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiry < new Date();
}

/**
 * Calculate days remaining until expiry
 */
export function daysUntilExpiry(expiresAt: Date | string): number {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
