# AlphaQuest

AlphaQuest is a Web3 growth quest platform for project teams and crypto users.

## Product Positioning

AlphaQuest combines:

- B2B Web3 growth campaigns
- C2C/C2 user quest and points system
- Referral-based growth
- Auditable point ledger
- On-chain fair reward pools
- API / Webhook integration for external projects

## MVP Scope

The MVP validates this core loop:

```text
Project creates campaign
  -> configures tasks
  -> user completes tasks
  -> user earns points
  -> user invites friends
  -> user joins reward pool with points
  -> reward pool is sealed on-chain
  -> VRF-style randomness selects winner
  -> winner claims prize
  -> project reviews analytics
```

## Recommended First Product Form

- User Web / H5
- Project Dashboard
- Admin Panel
- API / Webhook
- Smart Contracts

Do not implement native iOS/Android apps, platform tokens, point withdrawal, point trading, paid-credit random draws, or multi-level commissions in MVP.

## Repository Layout

```text
apps/
  web/          User-facing Web/H5 app
  dashboard/    Project owner dashboard
  admin/        Platform admin panel
  api/          Backend API service
packages/
  ui/           Shared UI components
  types/        Shared TypeScript types
  utils/        Shared utilities
contracts/      Solidity contracts and Foundry tests
services/
  indexer/      Chain event indexer
  worker/       Async workers
  risk-engine/  Risk engine service, can start inside API
scripts/        Dev and ops scripts
docs/           Product, API, and Codex execution docs
```

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Contract tests:

```bash
cd contracts
forge test
```

## Codex Workflow

Read `AGENTS.md` first. Then open the relevant file under `docs/codex/tasks/` and run each task as a focused Codex job.
