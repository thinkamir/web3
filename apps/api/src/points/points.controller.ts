import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';

@ApiTags('Points')
@Controller('points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get('balance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user point balance' })
  async getBalance(@Request() req: any) {
    return this.pointsService.getBalance(req.user.userId);
  }

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user point transactions' })
  async getTransactions(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.pointsService.getTransactions(req.user.userId, limit, offset);
  }

  @Post('grant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grant points to user (admin or API)' })
  async grantPoints(@Body() data: {
    user_id: string;
    amount: number;
    source_type: string;
    source_id?: string;
    status?: 'available' | 'pending';
  }) {
    return this.pointsService.grantPoints(data);
  }

  @Post('lock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock points for draw participation' })
  async lockPoints(@Body() data: {
    user_id: string;
    amount: number;
    source_id: string;
  }) {
    return this.pointsService.lockPoints(data.user_id, data.amount, data.source_id);
  }

  @Post('reverse')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reverse a point transaction (admin)' })
  async reverseTransaction(@Body() data: {
    transaction_id: string;
    reason: string;
  }) {
    return this.pointsService.reverseTransaction(data.transaction_id, data.reason);
  }
}
