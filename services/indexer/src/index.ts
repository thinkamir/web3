import { ethers, Contract, JsonRpcProvider, Event } from 'ethers';
import { PrismaClient } from '@prisma/client';

const PRIZE_VAULT_ABI = [
  'event PrizeDeposited(bytes32 indexed prizeId, address indexed sponsor, uint256 amount, address token, uint256 tokenId, bool isNFT)',
  'event PrizeLocked(bytes32 indexed prizeId, address indexed roundAddress)',
  'event PrizeReleased(bytes32 indexed prizeId, address indexed winner, uint256 amount)',
  'event PrizeRefunded(bytes32 indexed prizeId, address indexed sponsor, uint256 amount)',
];

const DRAW_MANAGER_ABI = [
  'event RoundCreated(uint256 indexed roundId, address indexed creator, uint256 prizeId)',
  'event RoundOpened(uint256 indexed roundId)',
  'event BatchCommitted(uint256 indexed roundId, uint256 ticketCount)',
  'event RoundSealed(uint256 indexed roundId, bytes32 merkleRoot, uint256 totalTickets)',
  'event RandomnessRequested(uint256 indexed roundId, uint256 requestId)',
  'event RoundFinalized(uint256 indexed roundId, uint256 randomness, uint256 winningTicket)',
  'event PrizeClaimed(uint256 indexed roundId, address indexed winner)',
  'event RoundCancelled(uint256 indexed roundId)',
];

interface IndexerConfig {
  rpcUrl: string;
  vaultAddress: string;
  drawManagerAddress: string;
  startBlock: number;
  pollInterval: number;
}

class BlockchainIndexer {
  private provider: JsonRpcProvider;
  private vault: Contract;
  private drawManager: Contract;
  private prisma: PrismaClient;
  private config: IndexerConfig;
  private currentBlock: number;

  constructor(config: IndexerConfig) {
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.vault = new Contract(config.vaultAddress, PRIZE_VAULT_ABI, this.provider);
    this.drawManager = new Contract(config.drawManagerAddress, DRAW_MANAGER_ABI, this.provider);
    this.prisma = new PrismaClient();
    this.config = config;
    this.currentBlock = config.startBlock;
  }

  async start() {
    console.log('Starting blockchain indexer...');
    console.log(`Vault: ${this.config.vaultAddress}`);
    console.log(`Draw Manager: ${this.config.drawManagerAddress}`);
    console.log(`Starting from block: ${this.currentBlock}`);

    await this.indexPastEvents();

    setInterval(() => this.pollNewBlocks(), this.config.pollInterval);
  }

  private async indexPastEvents() {
    const latestBlock = await this.provider.getBlockNumber();
    console.log(`Indexing events from block ${this.currentBlock} to ${latestBlock}`);

    await this.indexVaultEvents(this.currentBlock, latestBlock);
    await this.indexDrawManagerEvents(this.currentBlock, latestBlock);

    this.currentBlock = latestBlock + 1;
  }

  private async indexVaultEvents(fromBlock: number, toBlock: number) {
    try {
      const prizeDepositedFilter = this.vault.filters.PrizeDeposited();
      const prizeLockedFilter = this.vault.filters.PrizeLocked();
      const prizeReleasedFilter = this.vault.filters.PrizeReleased();
      const prizeRefundedFilter = this.vault.filters.PrizeRefunded();

      const [deposited, locked, released, refunded] = await Promise.all([
        this.vault.queryFilter(prizeDepositedFilter, fromBlock, toBlock),
        this.vault.queryFilter(prizeLockedFilter, fromBlock, toBlock),
        this.vault.queryFilter(releasedFilter, fromBlock, toBlock),
        this.vault.queryFilter(refundedFilter, fromBlock, toBlock),
      ]);

      for (const event of deposited) {
        await this.handlePrizeDeposited(event);
      }

      for (const event of locked) {
        await this.handlePrizeLocked(event);
      }

      for (const event of released) {
        await this.handlePrizeReleased(event);
      }

      console.log(`Indexed ${deposited.length} deposited, ${locked.length} locked, ${released.length} released events`);
    } catch (error) {
      console.error('Error indexing vault events:', error);
    }
  }

  private async indexDrawManagerEvents(fromBlock: number, toBlock: number) {
    try {
      const roundCreatedFilter = this.drawManager.filters.RoundCreated();
      const roundOpenedFilter = this.drawManager.filters.RoundOpened();
      const roundSealedFilter = this.drawManager.filters.RoundSealed();
      const randomnessRequestedFilter = this.drawManager.filters.RandomnessRequested();
      const roundFinalizedFilter = this.drawManager.filters.RoundFinalized();
      const prizeClaimedFilter = this.drawManager.filters.PrizeClaimed();
      const roundCancelledFilter = this.drawManager.filters.RoundCancelled();

      const [created, opened, sealed, randomnessRequested, finalized, claimed, cancelled] = await Promise.all([
        this.drawManager.queryFilter(roundCreatedFilter, fromBlock, toBlock),
        this.drawManager.queryFilter(roundOpenedFilter, fromBlock, toBlock),
        this.drawManager.queryFilter(roundSealedFilter, fromBlock, toBlock),
        this.drawManager.queryFilter(randomnessRequestedFilter, fromBlock, toBlock),
        this.drawManager.queryFilter(roundFinalizedFilter, fromBlock, toBlock),
        this.drawManager.queryFilter(prizeClaimedFilter, fromBlock, toBlock),
        this.drawManager.queryFilter(roundCancelledFilter, fromBlock, toBlock),
      ]);

      for (const event of created) await this.handleRoundCreated(event);
      for (const event of opened) await this.handleRoundOpened(event);
      for (const event of sealed) await this.handleRoundSealed(event);
      for (const event of randomnessRequested) await this.handleRandomnessRequested(event);
      for (const event of finalized) await this.handleRoundFinalized(event);
      for (const event of claimed) await this.handlePrizeClaimed(event);
      for (const event of cancelled) await this.handleRoundCancelled(event);

      console.log(`Indexed ${created.length} created, ${sealed.length} sealed, ${finalized.length} finalized events`);
    } catch (error) {
      console.error('Error indexing draw manager events:', error);
    }
  }

  private async handlePrizeDeposited(event: Event) {
    const [prizeId, sponsor, amount, token, tokenId, isNFT] = event.args;
    console.log(`PrizeDeposited: ${prizeId}, sponsor: ${sponsor}, amount: ${amount}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_prize_deposited',
        event_data: {
          prizeId: prizeId.toString(),
          sponsor,
          amount: amount.toString(),
          token,
          tokenId: tokenId.toString(),
          isNFT,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handlePrizeLocked(event: Event) {
    const [prizeId, roundAddress] = event.args;
    console.log(`PrizeLocked: ${prizeId}, round: ${roundAddress}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_prize_locked',
        event_data: {
          prizeId: prizeId.toString(),
          roundAddress,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handlePrizeReleased(event: Event) {
    const [prizeId, winner, amount] = event.args;
    console.log(`PrizeReleased: ${prizeId}, winner: ${winner}, amount: ${amount}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_prize_released',
        event_data: {
          prizeId: prizeId.toString(),
          winner,
          amount: amount.toString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handleRoundCreated(event: Event) {
    const [roundId, creator, prizeId] = event.args;
    console.log(`RoundCreated: ${roundId}, creator: ${creator}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_round_created',
        event_data: {
          roundId: roundId.toString(),
          creator,
          prizeId: prizeId.toString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handleRoundOpened(event: Event) {
    const [roundId] = event.args;
    console.log(`RoundOpened: ${roundId}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_round_opened',
        event_data: {
          roundId: roundId.toString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handleRoundSealed(event: Event) {
    const [roundId, merkleRoot, totalTickets] = event.args;
    console.log(`RoundSealed: ${roundId}, tickets: ${totalTickets}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_round_sealed',
        event_data: {
          roundId: roundId.toString(),
          merkleRoot,
          totalTickets: totalTickets.toString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handleRandomnessRequested(event: Event) {
    const [roundId, requestId] = event.args;
    console.log(`RandomnessRequested: ${roundId}, requestId: ${requestId}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_randomness_requested',
        event_data: {
          roundId: roundId.toString(),
          requestId: requestId.toString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handleRoundFinalized(event: Event) {
    const [roundId, randomness, winningTicket] = event.args;
    console.log(`RoundFinalized: ${roundId}, winning ticket: ${winningTicket}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_round_finalized',
        event_data: {
          roundId: roundId.toString(),
          randomness: randomness.toString(),
          winningTicket: winningTicket.toString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handlePrizeClaimed(event: Event) {
    const [roundId, winner] = event.args;
    console.log(`PrizeClaimed: ${roundId}, winner: ${winner}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_prize_claimed',
        event_data: {
          roundId: roundId.toString(),
          winner,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async handleRoundCancelled(event: Event) {
    const [roundId] = event.args;
    console.log(`RoundCancelled: ${roundId}`);

    await this.prisma.riskEvent.create({
      data: {
        event_type: 'chain_round_cancelled',
        event_data: {
          roundId: roundId.toString(),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
        },
      },
    });
  }

  private async pollNewBlocks() {
    try {
      const latestBlock = await this.provider.getBlockNumber();

      if (latestBlock > this.currentBlock) {
        await this.indexVaultEvents(this.currentBlock, latestBlock);
        await this.indexDrawManagerEvents(this.currentBlock, latestBlock);
        this.currentBlock = latestBlock + 1;
      }
    } catch (error) {
      console.error('Error polling blocks:', error);
    }
  }

  async stop() {
    await this.prisma.$disconnect();
    console.log('Indexer stopped');
  }
}

const config: IndexerConfig = {
  rpcUrl: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
  vaultAddress: process.env.PRIZE_VAULT_ADDRESS || '',
  drawManagerAddress: process.env.DRAW_MANAGER_ADDRESS || '',
  startBlock: parseInt(process.env.START_BLOCK || '0', 10),
  pollInterval: parseInt(process.env.POLL_INTERVAL || '15000', 10),
};

const indexer = new BlockchainIndexer(config);

indexer.start().catch(console.error);

process.on('SIGTERM', async () => {
  await indexer.stop();
  process.exit(0);
});
