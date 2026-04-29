# AlphaQuest Batch 2 Backend Task Pack

This task pack covers:
- Task/Point backend (Agent 5)
- Referral/Risk backend (Agent 7)
- API Key/HMAC/Webhook backend (Agent 10)

## 1) Task/Point Backend

### Scope
- Task lifecycle: create, list, update, submit, review, complete.
- Submission state machine: `available -> pending -> completed|failed`.
- Point ledger: all point mutations must go through `point_transactions`.
- Balance views: `available`, `pending`, `locked` derived from ledger.
- Idempotent reward issuing per `(user_id, task_id, rule_version)`.

### Suggested data model
- `tasks`
- `task_rules`
- `task_submissions`
- `point_accounts`
- `point_transactions`
- `point_transaction_refs` (for idempotency)

### APIs
- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks/:id/submit`
- `POST /task-submissions/:id/review`
- `GET /points/balance`
- `GET /points/transactions`
- `POST /points/adjust` (admin only)

### Acceptance
- Any point change always inserts one immutable `point_transactions` row.
- Duplicate submission reward is blocked idempotently.
- Reversal creates compensating transaction; never hard-delete.

---

## 2) Referral/Risk Backend

### Scope
- One-time inviter binding during first login/registration.
- Referral graph storage and query.
- Referral reward policy with delayed release (`pending -> available`).
- Basic risk engine with score + reason codes.
- Freeze/blacklist controls that can block task reward and draw entry.

### Suggested data model
- `referrals` (`inviter_id`, `invitee_id`, `bound_at`, `status`)
- `referral_rewards`
- `risk_profiles`
- `risk_events`
- `risk_actions` (freeze/unfreeze/blacklist)

### APIs
- `POST /referrals/bind`
- `GET /referrals/me`
- `POST /referrals/rewards/evaluate`
- `POST /risk/evaluate-user`
- `POST /risk/evaluate-task-submission`
- `POST /risk/evaluate-referral`
- `POST /risk/users/:id/freeze`
- `POST /risk/users/:id/unfreeze`

### Acceptance
- Invitee can only bind one inviter for lifetime.
- Referral rewards respect risk status (high risk blocked, medium risk pending).
- Admin risk actions are auditable.

---

## 3) API Key / HMAC / Webhook Backend

### Scope
- Project-scoped API keys with fine-grained permissions.
- Secret shown once; store hashed secret only.
- HMAC auth for write APIs with replay protection (`timestamp + nonce`).
- Webhook subscription, delivery queue, signed payload, retry, and logs.

### Suggested data model
- `api_keys`
- `api_key_scopes`
- `api_request_nonces`
- `webhook_endpoints`
- `webhook_deliveries`
- `audit_logs`

### APIs
- `POST /developer/api-keys`
- `GET /developer/api-keys`
- `POST /developer/api-keys/:id/rotate`
- `DELETE /developer/api-keys/:id`
- `POST /developer/webhooks`
- `GET /developer/webhooks`
- `POST /developer/webhooks/:id/test`
- `GET /developer/webhooks/:id/deliveries`

### HMAC contract
- Headers:
  - `X-API-Key`
  - `X-Signature`
  - `X-Timestamp` (unix seconds)
  - `X-Nonce`
- Canonical string:
  - `METHOD\nPATH\nTIMESTAMP\nNONCE\nSHA256(BODY)`
- Signature:
  - `hex(HMAC_SHA256(api_secret, canonical_string))`

### Webhook contract
- Delivery signature header: `X-AlphaQuest-Signature`
- Retry policy: exponential backoff with max attempts (e.g. 8)
- Replay-safe event id in payload

### Acceptance
- Cross-project access is forbidden even with valid key.
- Expired timestamp / duplicated nonce requests are rejected.
- Failed webhooks are retried and fully logged.

---

## 4) Integration milestones

1. Implement DB migrations for all tables.
2. Implement services with unit tests.
3. Implement controllers + guards/middleware.
4. Add integration tests for key flows:
   - task completion => point transaction
   - invite completion => pending referral reward
   - HMAC-auth write endpoint success/failure
   - webhook retry + log persistence

## 5) Security checklist

- No plaintext secret storage.
- Every write API has authorization checks.
- Every point mutation is ledger-backed.
- Admin operations are audit-logged.
- Nonce/timestamp replay defense enabled.
