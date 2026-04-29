# AlphaQuest Coding & Security Rules

- Keep changes small and reviewable.
- Every feature must include tests.
- Do not hardcode secrets.
- Do not bypass authorization checks.
- Do not mutate point balances without point_transactions.
- Any point change must be auditable.
- Any API write action must have permission checks.
- Any contract change must include Foundry tests.
- Contracts must use least-privilege access control.
- Prize custody, randomness, Merkle roots, and claims must be testable.
- Do not implement out-of-scope financial or gambling-like features.
