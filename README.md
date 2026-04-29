# AlphaQuest - Web3 Growth Platform

AlphaQuest is a Web3 project growth infrastructure platform that enables projects to create quests, reward users with points, manage campaigns, and conduct on-chain fair draws.

## Features

- **Wallet Login**: Secure authentication via wallet signature
- **Quest System**: Social tasks, on-chain tasks, quiz tasks, daily sign-in
- **Point System**: Earn, spend, and track points with full audit trail
- **Referral System**: Invite friends and earn rewards
- **Fair Draws**: On-chain prize pools with VRF-style randomness
- **Risk Engine**: Built-in risk scoring and fraud prevention
- **API Platform**: Full API access for project integration

## Tech Stack

- **Monorepo**: pnpm workspace
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: NestJS, Prisma, PostgreSQL
- **Contracts**: Solidity, Foundry, OpenZeppelin
- **Web3**: viem, wagmi

## Project Structure

```
alphaquest/
├── apps/
│   ├── web/          # User-facing web application
│   ├── dashboard/    # Project owner dashboard
│   ├── admin/        # Platform admin dashboard
│   └── api/          # Backend API service
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/         # Shared TypeScript types
│   └── config/        # Shared configurations
├── contracts/        # Solidity smart contracts
└── services/         # Backend microservices
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- PostgreSQL
- Foundry (for contract development)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env

# Generate Prisma client
pnpm --filter @alphaquest/api db:generate

# Run database migrations
pnpm --filter @alphaquest/api db:migrate
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Start specific app
pnpm --filter @alphaquest/web dev
pnpm --filter @alphaquest/api dev
```

### Smart Contracts

```bash
cd contracts

# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test
```

## API Documentation

API documentation is available at `/api/docs` when the API server is running.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all apps |
| `pnpm lint` | Run linters |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run all tests |

## License

MIT
