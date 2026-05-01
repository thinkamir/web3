import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Get()
  @ApiOperation({ summary: 'Get all campaigns' })
  async findAll(@Query() filters: {
    project_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.campaignService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  async findById(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new campaign' })
  async create(@CurrentUser() user: JwtUser, @Body() data: {
    project_id: string;
    title: string;
    description: string;
    start_time: Date;
    end_time: Date;
    region_restriction?: string[];
    risk_level?: string;
    reward_config?: any;
    risk_config?: any;
    terms?: string;
  }) {
    return this.campaignService.createForUser(user.userId, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update campaign' })
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() data: Partial<{
      title: string;
      description: string;
      status: string;
      start_time: Date;
      end_time: Date;
      region_restriction: string[];
      risk_level: string;
      reward_config: any;
      risk_config: any;
      terms: string;
    }>,
  ) {
    return this.campaignService.updateForUser(id, user.userId, data);
  }

  @Post(':id/submit-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit campaign for review' })
  async submitReview(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.campaignService.submitForReviewForUser(id, user.userId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish campaign (admin)' })
  async publish(@Param('id') id: string) {
    return this.campaignService.publish(id);
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get campaign analytics' })
  async getAnalytics(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.campaignService.getAnalyticsForUser(id, user.userId);
  }
}
