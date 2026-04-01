/**
 * Tally Credit Layer API — Official JavaScript SDK
 * @version 0.1.0
 * @author The 36th Company Ltd
 */

const DEFAULT_BASE_URL = 'https://api.usetally.dev'
const SANDBOX_BASE_URL = 'https://api.usetally.dev/sandbox'

class TallyError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'TallyError'
    this.status = status
    this.body = body
  }
}

class TallyClient {
  /**
   * Create a new Tally client
   * @param {string} apiKey - Your Tally API key
   * @param {object} options - Optional config
   * @param {boolean} options.sandbox - Use sandbox mode (test keys only)
   * @param {string} options.baseUrl - Override the base URL
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) throw new Error('Tally: apiKey is required')

    this.apiKey = apiKey
    this.sandbox = options.sandbox || apiKey.startsWith('tally_test_')
    this.baseUrl = options.baseUrl || (this.sandbox ? SANDBOX_BASE_URL : DEFAULT_BASE_URL)

    // Bind namespaces
    this.credits = {
      add: this._add.bind(this),
      deduct: this._deduct.bind(this),
      refund: this._refund.bind(this),
      balance: this._balance.bind(this),
      history: this._history.bind(this),
    }
  }

  // ─── Internal request helper ───────────────────────────────
  async _request(method, path, body = null, idempotencyKey = null) {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Tally-SDK': 'js/0.1.0',
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }

    const config = { method, headers }
    if (body) config.body = JSON.stringify(body)

    const url = `${this.baseUrl}${path}`

    let response
    try {
      response = await fetch(url, config)
    } catch (err) {
      throw new TallyError(`Network error: ${err.message}`, 0, null)
    }

    let data
    try {
      data = await response.json()
    } catch {
      throw new TallyError('Failed to parse response', response.status, null)
    }

    if (!response.ok) {
      throw new TallyError(
        data.error || data.message || 'Request failed',
        response.status,
        data
      )
    }

    return data
  }

  // ─── Credits.add ──────────────────────────────────────────
  /**
   * Add credits to a user's balance
   * @param {object} params
   * @param {string} params.user_id - Your internal user ID
   * @param {number} params.amount - Credits to add (must be positive)
   * @param {string} [params.description] - Reason for this transaction
   * @param {string} [params.reference_id] - External reference e.g. payment ID
   * @param {object} [params.metadata] - Any extra data to store
   * @param {string} [params.idempotency_key] - Prevent duplicate transactions
   * @returns {Promise<{success: boolean, ledger_id: string, balance_after: number}>}
   */
  async _add({ user_id, amount, description, reference_id, metadata, idempotency_key } = {}) {
    if (!user_id) throw new Error('Tally.credits.add: user_id is required')
    if (!amount || amount <= 0) throw new Error('Tally.credits.add: amount must be a positive number')

    return this._request('POST', '/credits/add', {
      user_id, amount, description, reference_id, metadata
    }, idempotency_key)
  }

  // ─── Credits.deduct ───────────────────────────────────────
  /**
   * Deduct credits from a user atomically
   * Returns { success: false } with status 402 if insufficient balance
   * @param {object} params
   * @param {string} params.user_id - Your internal user ID
   * @param {number} params.amount - Credits to deduct
   * @param {string} [params.description] - What the credits were used for
   * @param {string} [params.reference_id] - Your internal action ID
   * @param {string} [params.idempotency_key] - Prevent duplicate deductions
   * @returns {Promise<{success: boolean, ledger_id: string, balance_before: number, balance_after: number}>}
   */
  async _deduct({ user_id, amount, description, reference_id, idempotency_key } = {}) {
    if (!user_id) throw new Error('Tally.credits.deduct: user_id is required')
    if (!amount || amount <= 0) throw new Error('Tally.credits.deduct: amount must be a positive number')

    try {
      return await this._request('POST', '/credits/deduct', {
        user_id, amount, description, reference_id
      }, idempotency_key)
    } catch (err) {
      if (err.status === 402) {
        return { success: false, error: err.body?.error || 'Insufficient credits', balance: err.body?.balance }
      }
      throw err
    }
  }

  // ─── Credits.refund ───────────────────────────────────────
  /**
   * Reverse a previous transaction by ledger ID
   * @param {object} params
   * @param {string} params.ledger_id - The ledger entry to reverse
   * @param {string} [params.description] - Reason for refund
   * @param {string} [params.idempotency_key] - Prevent duplicate refunds
   * @returns {Promise<{success: boolean, ledger_id: string, amount_refunded: number, balance_after: number}>}
   */
  async _refund({ ledger_id, description, idempotency_key } = {}) {
    if (!ledger_id) throw new Error('Tally.credits.refund: ledger_id is required')

    return this._request('POST', '/credits/refund', {
      ledger_id, description
    }, idempotency_key)
  }

  // ─── Credits.balance ──────────────────────────────────────
  /**
   * Get a user's current credit balance
   * @param {string} user_id - Your internal user ID
   * @returns {Promise<{user_id: string, balance: number, updated_at: string}>}
   */
  async _balance(user_id) {
    if (!user_id) throw new Error('Tally.credits.balance: user_id is required')
    return this._request('GET', `/credits/balance?user_id=${encodeURIComponent(user_id)}`)
  }

  // ─── Credits.history ──────────────────────────────────────
  /**
   * Get paginated transaction history for a user
   * @param {string} user_id - Your internal user ID
   * @param {object} [options]
   * @param {number} [options.limit=50] - Number of results
   * @param {number} [options.offset=0] - Pagination offset
   * @returns {Promise<{user_id: string, entries: Array, total: number}>}
   */
  async _history(user_id, { limit = 50, offset = 0 } = {}) {
    if (!user_id) throw new Error('Tally.credits.history: user_id is required')
    return this._request('GET', `/credits/history?user_id=${encodeURIComponent(user_id)}&limit=${limit}&offset=${offset}`)
  }
}




// CJS exports
module.exports = TallyClient
module.exports.Tally = TallyClient
module.exports.TallyError = TallyError
module.exports.default = TallyClient
