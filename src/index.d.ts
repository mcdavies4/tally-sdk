/**
 * Tally Credit Layer API — TypeScript Definitions
 */

export interface TallyOptions {
  /** Use sandbox mode for testing */
  sandbox?: boolean
  /** Override the base API URL */
  baseUrl?: string
}

export interface AddCreditsParams {
  /** Your internal user identifier */
  user_id: string
  /** Number of credits to add (must be positive) */
  amount: number
  /** Human-readable reason for this transaction */
  description?: string
  /** External reference e.g. Stripe payment ID */
  reference_id?: string
  /** Any extra data to store with this transaction */
  metadata?: Record<string, unknown>
  /** Prevent duplicate transactions */
  idempotency_key?: string
}

export interface DeductCreditsParams {
  /** Your internal user identifier */
  user_id: string
  /** Number of credits to deduct */
  amount: number
  /** What the credits were used for */
  description?: string
  /** Your internal action or request ID */
  reference_id?: string
  /** Prevent duplicate deductions */
  idempotency_key?: string
}

export interface RefundCreditsParams {
  /** The ledger entry ID to reverse */
  ledger_id: string
  /** Reason for the refund */
  description?: string
  /** Prevent duplicate refunds */
  idempotency_key?: string
}

export interface HistoryOptions {
  /** Number of results (default: 50) */
  limit?: number
  /** Pagination offset (default: 0) */
  offset?: number
}

export interface AddCreditsResult {
  success: true
  ledger_id: string
  user_id: string
  amount: number
  balance_after: number
  idempotent?: boolean
}

export interface DeductCreditsResult {
  success: boolean
  ledger_id?: string
  balance_before?: number
  balance_after?: number
  error?: string
  balance?: number
  idempotent?: boolean
}

export interface RefundCreditsResult {
  success: true
  ledger_id: string
  original_ledger_id: string
  user_id: string
  amount_refunded: number
  balance_after: number
}

export interface BalanceResult {
  user_id: string
  balance: number
  updated_at: string
}

export interface LedgerEntry {
  id: string
  event_type: 'add' | 'deduct' | 'refund' | 'adjustment'
  amount: number
  balance_after: number
  reference_id?: string
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface HistoryResult {
  user_id: string
  entries: LedgerEntry[]
  total: number
  limit: number
  offset: number
}

export interface CreditsNamespace {
  /** Add credits to a user's balance */
  add(params: AddCreditsParams): Promise<AddCreditsResult>
  /** Atomically deduct credits from a user */
  deduct(params: DeductCreditsParams): Promise<DeductCreditsResult>
  /** Reverse a previous transaction by ledger ID */
  refund(params: RefundCreditsParams): Promise<RefundCreditsResult>
  /** Get a user's current credit balance */
  balance(user_id: string): Promise<BalanceResult>
  /** Get paginated transaction history for a user */
  history(user_id: string, options?: HistoryOptions): Promise<HistoryResult>
}

export declare class TallyError extends Error {
  name: 'TallyError'
  status: number
  body: Record<string, unknown> | null
  constructor(message: string, status: number, body: Record<string, unknown> | null)
}

export declare class Tally {
  credits: CreditsNamespace
  sandbox: boolean
  baseUrl: string

  constructor(apiKey: string, options?: TallyOptions)
}

export { Tally as default }
