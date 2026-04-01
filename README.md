# @tally-credits/sdk

Official JavaScript SDK for the [Tally Credit Layer API](https://tally-landing-ochre.vercel.app).

Stop rebuilding credit logic. Add, deduct and refund user credits in 3 API calls.

## Installation

```bash
npm install @tally-credits/sdk
```

## Quick start

```js
import Tally from '@tally-credits/sdk'

const tally = new Tally('tally_your_api_key_here')

// Add credits when a user pays
await tally.credits.add({
  user_id: 'user_001',
  amount: 500,
  description: 'Starter pack purchase',
})

// Deduct credits when a user acts
const result = await tally.credits.deduct({
  user_id: 'user_001',
  amount: 10,
  description: 'AI generation',
})

if (!result.success) {
  // User is out of credits
  return res.status(402).json({ error: 'Insufficient credits' })
}

// Check balance
const { balance } = await tally.credits.balance('user_001')
console.log(`User has ${balance} credits`)
```

## Usage

### `tally.credits.add(params)`

Top up a user's credit balance.

| Param | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | ✓ | Your internal user ID |
| `amount` | number | ✓ | Credits to add |
| `description` | string | | Reason for transaction |
| `reference_id` | string | | External reference e.g. Stripe payment ID |
| `metadata` | object | | Extra data to store |
| `idempotency_key` | string | | Prevent duplicate transactions |

### `tally.credits.deduct(params)`

Atomically deduct credits. Returns `{ success: false }` if insufficient balance — never throws.

| Param | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | ✓ | Your internal user ID |
| `amount` | number | ✓ | Credits to deduct |
| `description` | string | | What credits were used for |
| `reference_id` | string | | Your internal action ID |
| `idempotency_key` | string | | Prevent duplicate deductions |

### `tally.credits.refund(params)`

Reverse a previous transaction by ledger ID.

| Param | Type | Required | Description |
|---|---|---|---|
| `ledger_id` | string | ✓ | The ledger entry to reverse |
| `description` | string | | Reason for refund |

### `tally.credits.balance(user_id)`

Get a user's current credit balance.

```js
const { balance } = await tally.credits.balance('user_001')
// { user_id: 'user_001', balance: 490, updated_at: '...' }
```

### `tally.credits.history(user_id, options?)`

Get paginated transaction history.

```js
const { entries, total } = await tally.credits.history('user_001', {
  limit: 20,
  offset: 0,
})
```

## Sandbox mode

Use a test API key (starts with `tally_test_`) or pass `{ sandbox: true }`:

```js
const tally = new Tally('tally_test_your_key', { sandbox: true })
```

Sandbox calls hit a separate environment — no real data is affected.

## Error handling

```js
import { Tally, TallyError } from '@tally-credits/sdk'

try {
  await tally.credits.add({ user_id: 'user_001', amount: 100 })
} catch (err) {
  if (err instanceof TallyError) {
    console.log(err.status) // HTTP status code
    console.log(err.body)   // Full error response
  }
}
```

Note: `credits.deduct` never throws on insufficient balance — it returns `{ success: false }` instead. Only network errors and invalid API keys throw.

## TypeScript

Full TypeScript support included out of the box — no `@types` package needed.

```ts
import Tally, { TallyError, DeductCreditsResult } from '@tally-credits/sdk'

const tally = new Tally(process.env.TALLY_API_KEY!)

const result: DeductCreditsResult = await tally.credits.deduct({
  user_id: req.user.id,
  amount: 10,
})
```

## License

MIT — The 36th Company Ltd
