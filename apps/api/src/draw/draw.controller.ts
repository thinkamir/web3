import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DrawService } from './draw.service';

@ApiTags('Draws')
@Controller('draws')
export class DrawController {
  constructor(private drawService: DrawService) {}

  @Get()
  @ApiOperation({ summary: 'Get all draws with filters' })
  async findAll(@Query() filters: {
    campaign_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.drawService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get draw by ID' })
  async findById(@Param('id') id: string) {
    return this.drawService.findById(id);
  }

  @Post(':id/join')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a draw' })
  async joinDraw(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { tickets?: number },
  ) {
    return this.drawService.joinDraw(id, req.user.userId, body.tickets || 1);
  }

  @Post(':id/seal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seal a draw and generate merkle root' })
  async sealDraw(@Param('id') id: string) {
    return this.drawService.sealDraw(id);
  }

  @Post(':id/request-randomness')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request randomness for draw' })
  async requestRandomness(@Param('id') id: string) {
    return this.drawService.requestRandomness(id);
  }

  @Post(':id/finalize')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Finalize draw with randomness' })
  async finalizeDraw(@Param('id') id: string, @Body() body: { randomness: string }) {
    return this.drawService.finalizeDraw(id, body.randomness);
  }

  @Post(':id/claim')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim prize' })
  async claimPrize(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { proof: string[] },
  ) {
    return this.drawService.claimPrize(id, req.user.userId, body.proof);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get draw result' })
  async getResult(@Param('id') id: string) {
    return this.drawService.getResult(id);
  }
}
