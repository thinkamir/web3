# AlphaQuest Agent Instructions

## Product Context

AlphaQuest is a Web3 growth quest platform with user tasks, points, referrals, project dashboards, API integration, and on-chain fair reward pools.

The MVP must support:

- Wallet login
- User profiles
- Project owner dashboard
- Campaign and task creation
- User task completion
- Auditable point ledger
- Referrals
- Basic risk engine
- On-chain fair reward pools using Merkle roots and VRF-style randomness
- Admin review panel
- API keys, HMAC signatures, and webhooks

## Tech Stack

Recommended stack:

- Monorepo: pnpm workspace
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: NestJS or Node.js TypeScript
- Database: PostgreSQL
- Cache / Queue: Redis + BullMQ
- Contracts: Solidity + Foundry + OpenZeppelin
- Web3: viem / wagmi

## Scope Rules

Do not implement these in MVP:

- Platform token issuance
- Point withdrawal
- Point transfer between users
- Point trading or secondary market
- Multi-level referral commissions
- Paid-credit random draws
- Gambling-style wording or mechanics
- Native iOS / Android apps

## Engineering Rules

- Keep changes small and reviewable.
- Add or update tests for every feature.
- Do not hardcode secrets.
- Do not bypass authorization checks.
- Any point change must be auditable through point_transactions.
- Do not mutate point balances without a corresponding ledger transaction.
- Any API write action must have permission checks.
- Any contract change must include Foundry tests.
- All external project API writes must use scoped permissions.
- Webhook signing and replay protection are mandatory.

## Suggested Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter api test
pnpm --filter web test
```

Contracts:

```bash
cd contracts
forge test
```

## Branch Naming

```text
feat/<scope>-<short-name>
fix/<scope>-<short-name>
test/<scope>-<short-name>
```

Examples:

```text
feat/auth-wallet-login
feat/web-user-ui-skeleton
feat/dashboard-campaign-wizard
feat/contracts-draw-manager
feat/api-point-ledger
feat/draw-service
feat/webhook-platform
```

## Pull Request Requirements

Each PR must include:

- Summary
- Scope
- Changed files
- Tests run
- Screenshots if UI changed
- Security considerations
- Known limitations

## PR Template

```md
## Summary

## Scope

## Changed Files

## Screenshots

## Tests Run

## Security Considerations

## Known Limitations

## Checklist
- [ ] Lint passed
- [ ] Typecheck passed
- [ ] Tests passed
- [ ] No secrets committed
- [ ] Authorization checked
- [ ] Audit logs added where needed
```
