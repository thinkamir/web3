# AlphaQuest Web3 Development Context

Read and follow AGENTS.md first. Product specs are in docs/product/PRD.md and docs/product/MVP_EXECUTION_PLAN.md.

Current project state:
- Monorepo uses pnpm workspaces and turbo.
- Main apps: apps/web, apps/dashboard, apps/admin, apps/api.
- Shared packages: packages/ui, packages/types, packages/config.
- Contracts are in contracts/.
- Use mock data for UI skeletons unless explicitly asked to wire real APIs.
- Do not hardcode secrets or read .env files.
- Keep changes small, typed, and testable.

Required commands before claiming completion when relevant:
- pnpm --filter @alphaquest/api db:generate after Prisma schema changes.
- pnpm typecheck
- pnpm build
- pnpm test

Important MVP constraints:
- Do not implement platform token issuance, point withdrawal, point trading, multi-level referral commissions, paid-credit random draws, or gambling wording.
- Any point balance mutation must have a corresponding point_transactions ledger entry.
- API write actions must enforce authorization checks.
- Webhook signing and replay protection are mandatory for external project API writes.
- Contract changes require Foundry tests.

When working on UI:
- Prefer reusable local components under the app's src/components or src/app/components.
- Ensure mobile-first responsive layouts.
- Use TypeScript types for mock objects.
