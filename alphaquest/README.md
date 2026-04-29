# AlphaQuest Monorepo

Production-oriented monorepo scaffold for AlphaQuest, a Web3 growth quest platform with off-chain points and on-chain fair reward pools.

## Workspace Layout

- `apps/web`: user-facing quest app
- `apps/dashboard`: project owner dashboard
- `apps/admin`: admin operations panel
- `apps/api`: backend API (module placeholders)
- `packages/*`: shared UI/config/types/utils libraries
- `contracts`: Foundry Solidity workspace
- `services/*`: indexer, worker, and risk engine placeholders
- `docs/*`: product/API/contracts/runbook documentation

## Local Setup

1. Install Node.js 20+ and pnpm 9+
2. Install Foundry (`forge`)
3. Run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
cd contracts && forge test
```

## Notes

- `docs/product/PRD.md` and `docs/product/MVP_EXECUTION_PLAN.md` are placeholders if not finalized yet.
- Replace placeholder modules and contracts with full implementations in iterative feature PRs.
