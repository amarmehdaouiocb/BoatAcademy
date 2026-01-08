import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@boatacademy/shared';

import { createCheckoutClient } from './modules/checkout';
import { createSessionsClient } from './modules/sessions';
import { createDocumentsClient } from './modules/documents';
import { createMessagesClient } from './modules/messages';
import { createPushClient } from './modules/push';

export type { ApiClient } from './types';

/**
 * Create the Boat Academy API client
 *
 * This is the main entry point for all API calls.
 * Currently uses Supabase Edge Functions (Option A).
 * Can be swapped to HTTP transport (Option B) later without breaking apps.
 *
 * @param supabase - Supabase client instance
 * @returns API client with all modules
 *
 * @example
 * ```typescript
 * import { createSupabaseClient } from './lib/supabase';
 * import { createApiClient } from '@boatacademy/api-client';
 *
 * const supabase = createSupabaseClient();
 * const api = createApiClient(supabase);
 *
 * // Use the API
 * const { url } = await api.checkout.createSession(productId);
 * ```
 */
export function createApiClient(supabase: SupabaseClient<Database>) {
  return {
    /**
     * Checkout / Payments module
     */
    checkout: createCheckoutClient(supabase),

    /**
     * Sessions / Enrollments module
     */
    sessions: createSessionsClient(supabase),

    /**
     * Documents / Validation module
     */
    documents: createDocumentsClient(supabase),

    /**
     * Messages / Conversations module
     */
    messages: createMessagesClient(supabase),

    /**
     * Push notifications module
     */
    push: createPushClient(supabase),
  };
}

// Re-export types
export * from './types';
