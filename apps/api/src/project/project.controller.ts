import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminUpdateProjectDto, CreateProjectDto, RejectProjectDto, UpdateProjectDto } from './dto/project.dto';

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new project' })
  async create(@CurrentUser() user: JwtUser, @Body() data: CreateProjectDto) {
    return this.projectService.create(user.userId, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update project' })
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() data: UpdateProjectDto,
  ) {
    return this.projectService.updateForUser(id, user.userId, data);
  }

  @Post(':id/submit-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit project for review' })
  async submitReview(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.projectService.submitForReviewForUser(id, user.userId);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify project (admin)' })
  async verify(@Param('id') id: string) {
    return this.projectService.verify(id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject project (admin)' })
  async reject(@Param('id') id: string, @Body() body: RejectProjectDto) {
    return this.projectService.reject(id, body.reason);
  }

  @Get(':id/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project dashboard data' })
  async getDashboard(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.projectService.getDashboardForUser(id, user.userId);
  }
}
