import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';

@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  async findAll(@Query() filters: {
    campaign_id?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.taskService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async findById(@Param('id') id: string) {
    return this.taskService.findById(id);
  }

  @Post(':id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit task completion' })
  async submitTask(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { proof?: any },
  ) {
    return this.taskService.submitTask(id, req.user.userId, body.proof || {});
  }

  @Post(':id/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify task (admin or automatic verification)' })
  async verifyTask(
    @Param('id') id: string,
    @Body() body: { approved: boolean; note?: string },
  ) {
    return this.taskService.reviewSubmission(id, body.approved, body.note);
  }

  @Post('signin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process daily signin' })
  async signin(@Request() req: any) {
    return this.taskService.processSignin(req.user.userId);
  }

  @Post(':id/quiz')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit quiz answers' })
  async submitQuiz(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { answers: number[] },
  ) {
    return this.taskService.verifyQuizAnswer(id, req.user.userId, body.answers);
  }
}
