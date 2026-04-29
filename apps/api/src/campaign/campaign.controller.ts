import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';

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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new campaign' })
  async create(@Body() data: {
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
    return this.campaignService.create(data);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update campaign' })
  async update(
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
    return this.campaignService.update(id, data);
  }

  @Post(':id/submit-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit campaign for review' })
  async submitReview(@Param('id') id: string) {
    return this.campaignService.submitForReview(id);
  }

  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish campaign' })
  async publish(@Param('id') id: string) {
    return this.campaignService.publish(id);
  }

  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get campaign analytics' })
  async getAnalytics(@Param('id') id: string) {
    return this.campaignService.getAnalytics(id);
  }
}
