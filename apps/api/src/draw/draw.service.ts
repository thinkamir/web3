import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { ethers } from 'ethers';

@Injectable()
export class DrawService {
  constructor(
    private prisma: PrismaService,
    private pointsService: PointsService,
  ) {}

  async findAll(filters: {
    campaign_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.draw.findMany({
      where: {
        ...(filters.campaign_id && { campaign_id: filters.campaign_id }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(drawId: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!draw) {
      throw new NotFoundException('Draw not found');
    }

    return draw;
  }

  async joinDraw(drawId: string, userId: string, tickets: number = 1) {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
    });

    if (!draw) {
      throw new NotFoundException('Draw not found');
    }

    if (draw.status !== 'open' && draw.status !== 'filled') {
      throw new BadRequestException('Draw is not open for participation');
    }

    const now = new Date();
    if (now < draw.start_time || now > draw.end_time) {
      throw new BadRequestException('Draw is not within participation period');
    }

    const existingEntry = await this.prisma.drawEntry.findUnique({
      where: {
        draw_id_user_id: { draw_id: drawId, user_id: userId },
      },
    });

    if (existingEntry) {
      if (existingEntry.tickets + tickets > draw.max_per_user) {
        throw new BadRequestException('Exceeds maximum tickets per user');
      }
    }

    const pointsCost = tickets * draw.points_per_ticket;

    if (!draw.free_entry_enabled) {
      const balance = await this.pointsService.getBalance(userId);
      if (balance.available < pointsCost) {
        throw new BadRequestException('Insufficient points');
      }

      await this.pointsService.spendPoints(
        userId,
        pointsCost,
        'draw_participation',
        drawId,
      );
    }

    const totalCurrentTickets = draw.total_tickets || 0;
    const startTicket = totalCurrentTickets + 1;
    const endTicket = startTicket + tickets - 1;

    const entry = await this.prisma.drawEntry.upsert({
      where: {
        draw_id_user_id: { draw_id: drawId, user_id: userId },
      },
      create: {
        draw_id: drawId,
        user_id: userId,
        tickets,
        start_ticket: startTicket,
        end_ticket: endTicket,
        points_spent: pointsCost,
        status: 'active',
      },
      update: {
        tickets: { increment: tickets },
        end_ticket: { increment: tickets },
        points_spent: { increment: pointsCost },
      },
    });

    await this.prisma.draw.update({
      where: { id: drawId },
      data: {
        total_tickets: { increment: tickets },
        status: draw.total_tickets + tickets >= draw.target_points ? 'filled' : 'open',
      },
    });

    return {
      entry,
      ticket_range: [entry.start_ticket, entry.end_ticket],
      points_spent: pointsCost,
    };
  }

  async sealDraw(drawId: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
    });

    if (!draw) {
      throw new NotFoundException('Draw not found');
    }

    if (draw.status !== 'open' && draw.status !== 'filled') {
      throw new BadRequestException('Draw cannot be sealed');
    }

    const entries = await this.prisma.drawEntry.findMany({
      where: { draw_id: drawId },
    });

    const leaves = entries.map(entry =>
      ethers.solidityPackedKeccak256(
        ['string', 'uint256', 'uint256'],
        [entry.user_id, entry.start_ticket, entry.end_ticket],
      ),
    );

    const merkleRoot = this.computeMerkleRoot(leaves);

    await this.prisma.draw.update({
      where: { id: drawId },
      data: {
        status: 'sealed',
        merkle_root: merkleRoot,
        total_tickets: entries.reduce((sum, e) => sum + e.tickets, 0),
      },
    });

    return { merkle_root: merkleRoot, total_tickets: entries.reduce((sum, e) => sum + e.tickets, 0) };
  }

  async requestRandomness(drawId: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
    });

    if (!draw) {
      throw new NotFoundException('Draw not found');
    }

    if (draw.status !== 'sealed') {
      throw new BadRequestException('Draw must be sealed first');
    }

    await this.prisma.draw.update({
      where: { id: drawId },
      data: { status: 'random_requested' },
    });

    return { status: 'randomness_requested' };
  }

  async finalizeDraw(drawId: string, randomness: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
    });

    if (!draw) {
      throw new NotFoundException('Draw not found');
    }

    if (draw.status !== 'random_requested') {
      throw new BadRequestException('Randomness must be requested first');
    }

    const randomNumber = BigInt(randomness);
    const totalTickets = Number(draw.total_tickets);
    const winningTicket = Number(randomNumber % BigInt(totalTickets)) + 1;

    await this.prisma.draw.update({
      where: { id: drawId },
      data: {
        status: 'finalized',
        randomness,
        winning_ticket: winningTicket,
      },
    });

    const winnerEntry = await this.prisma.drawEntry.findFirst({
      where: {
        draw_id: drawId,
        start_ticket: { lte: winningTicket },
        end_ticket: { gte: winningTicket },
      },
    });

    if (winnerEntry) {
      await this.prisma.drawEntry.update({
        where: { id: winnerEntry.id },
        data: { status: 'won' },
      });
    }

    return {
      randomness,
      winning_ticket: winningTicket,
      winner: winnerEntry ? winnerEntry.user_id : null,
    };
  }

  async claimPrize(drawId: string, userId: string, proof: string[]) {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
    });

    if (!draw) {
      throw new NotFoundException('Draw not found');
    }

    if (draw.status !== 'finalized') {
      throw new BadRequestException('Draw not finalized');
    }

    const entry = await this.prisma.drawEntry.findUnique({
      where: {
        draw_id_user_id: { draw_id: drawId, user_id: userId },
      },
    });

    if (!entry) {
      throw new BadRequestException('User did not participate');
    }

    if (entry.claimed) {
      throw new BadRequestException('Prize already claimed');
    }

    const winningTicket = draw.winning_ticket;
    if (winningTicket === null || winningTicket === undefined) {
      throw new BadRequestException('Draw winning ticket is not available');
    }

    if (winningTicket < entry.start_ticket || winningTicket > entry.end_ticket) {
      throw new BadRequestException('Not a winner');
    }

    await this.prisma.drawEntry.update({
      where: { id: entry.id },
      data: { claimed: true },
    });

    await this.prisma.drawClaim.create({
      data: {
        draw_id: drawId,
        entry_id: entry.id,
        user_id: userId,
        proof,
      },
    });

    return { status: 'claimed', winner: userId };
  }

  async getResult(drawId: string) {
    const draw = await this.prisma.draw.findUnique({
      where: { id: drawId },
      include: {
        claims: {
          include: {
            user: {
              select: { wallet: true },
            },
          },
        },
      },
    });

    if (!draw) {
      throw new NotFoundException('Draw not found');
    }

    return {
      id: draw.id,
      status: draw.status,
      merkle_root: draw.merkle_root,
      randomness: draw.randomness,
      winning_ticket: draw.winning_ticket,
      total_tickets: draw.total_tickets,
      claims: draw.claims,
    };
  }

  private computeMerkleRoot(leaves: string[]): string {
    if (leaves.length === 0) return ethers.keccak256(ethers.toUtf8Bytes(''));
    if (leaves.length === 1) return leaves[0];

    const currentLevel = leaves;
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(
          ethers.solidityPackedKeccak256(
            ['bytes32', 'bytes32'],
            [currentLevel[i], currentLevel[i + 1]],
          ),
        );
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }

    return this.computeMerkleRoot(nextLevel);
  }
}
