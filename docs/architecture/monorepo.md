# AlphaQuest Monorepo Bootstrap

This repository is initialized as a pnpm workspace with three main areas:

- `apps/*`: product-facing applications (web, dashboard, admin, api).
- `packages/*`: shared TypeScript packages.
- `services/*`: backend/support services.
- `contracts/`: Solidity smart contracts and Foundry tests.

## Getting started

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Contracts:

```bash
cd contracts
forge test
```
