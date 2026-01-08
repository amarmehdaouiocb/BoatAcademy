import type { createApiClient } from './index';

/**
 * API Client type (inferred from createApiClient)
 */
export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * API Error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * API Response wrapper
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * Standard success response
 */
export interface SuccessResponse {
  ok: true;
}

/**
 * Checkout session response
 */
export interface CheckoutSessionResponse {
  url: string;
}

/**
 * Message response
 */
export interface MessageResponse {
  ok: true;
  message: {
    id: string;
    created_at: string;
  };
}

/**
 * Push result response
 */
export interface PushResponse {
  ok: true;
  sent: number;
  result?: unknown;
}
