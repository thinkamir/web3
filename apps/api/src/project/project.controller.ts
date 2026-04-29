import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from './project.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  async findAll(@Query() filters: {
    status?: string;
    risk_level?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.projectService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findById(@Param('id') id: string) {
    return this.projectService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new project' })
  async create(@Body() data: {
    name: string;
    website?: string;
    logo?: string;
    description?: string;
    owner_user_id: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  }) {
    return this.projectService.create(data);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update project' })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<{
      name: string;
      website: string;
      logo: string;
      description: string;
      twitter: string;
      telegram: string;
      discord: string;
      verification_status: string;
      risk_level: string;
    }>,
  ) {
    return this.projectService.update(id, data);
  }

  @Post(':id/submit-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit project for review' })
  async submitReview(@Param('id') id: string) {
    return this.projectService.submitForReview(id);
  }

  @Post(':id/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify project (admin)' })
  async verify(@Param('id') id: string) {
    return this.projectService.verify(id);
  }

  @Post(':id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject project (admin)' })
  async reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.projectService.reject(id, body.reason);
  }

  @Get(':id/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project dashboard data' })
  async getDashboard(@Param('id') id: string) {
    return this.projectService.getDashboard(id);
  }
}
