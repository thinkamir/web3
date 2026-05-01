import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    status?: string;
    risk_level?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.project.findMany({
      where: {
        ...(filters.status && { verification_status: filters.status }),
        ...(filters.risk_level && { risk_level: filters.risk_level }),
      },
      include: {
        campaigns: {
          select: { id: true, status: true },
        },
        _count: {
          select: { campaigns: true },
        },
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        campaigns: {
          where: { status: 'open' },
          take: 5,
          orderBy: { created_at: 'desc' },
        },
        owner: {
          select: { id: true, wallet: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(ownerUserId: string, data: {
    name: string;
    website?: string;
    logo?: string;
    description?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  }) {
    return this.prisma.project.create({
      data: {
        ...data,
        owner_user_id: ownerUserId,
        verification_status: 'pending',
        risk_level: 'low',
        project_members: {
          create: { user_id: ownerUserId, role: 'owner' },
        },
      },
    });
  }


  async assertProjectMember(projectId: string, userId: string, roles: string[] = ['owner', 'admin']) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { owner_user_id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.owner_user_id === userId && roles.includes('owner')) return;
    const member = await this.prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: projectId, user_id: userId } },
    });
    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenException('Project permission required');
    }
  }

  async updateForUser(projectId: string, userId: string, data: Partial<{
    name: string;
    website: string;
    logo: string;
    description: string;
    twitter: string;
    telegram: string;
    discord: string;
  }>) {
    await this.assertProjectMember(projectId, userId);
    return this.update(projectId, data);
  }

  async submitForReviewForUser(projectId: string, userId: string) {
    await this.assertProjectMember(projectId, userId);
    return this.submitForReview(projectId);
  }

  async getDashboardForUser(projectId: string, userId: string) {
    await this.assertProjectMember(projectId, userId, ['owner', 'admin', 'viewer']);
    return this.getDashboard(projectId);
  }

  async update(projectId: string, data: Partial<{
    name: string;
    website: string;
    logo: string;
    description: string;
    twitter: string;
    telegram: string;
    discord: string;
    verification_status: string;
    risk_level: string;
  }>) {
    return this.prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  async submitForReview(projectId: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: { verification_status: 'pending' },
    });
  }

  async verify(projectId: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: { verification_status: 'verified' },
    });
  }

  async reject(projectId: string, reason?: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: { verification_status: 'rejected' },
    });
  }

  async getDashboard(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        campaigns: {
          include: {
            tasks: {
              include: {
                submissions: {
                  where: { status: 'completed' },
                },
              },
            },
            draws: {
              include: {
                entries: true,
                claims: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let totalTasks = 0;
    let totalTaskSubmissions = 0;
    let totalDrawEntries = 0;
    let totalClaims = 0;

    for (const campaign of project.campaigns) {
      totalTasks += campaign.tasks.length;
      totalTaskSubmissions += campaign.tasks.reduce(
        (sum, task) => sum + task.submissions.length,
        0,
      );
      totalDrawEntries += campaign.draws.reduce((sum, d) => sum + d.entries.length, 0);
      totalClaims += campaign.draws.reduce((sum, d) => sum + d.claims.length, 0);
    }

    return {
      project_id: projectId,
      name: project.name,
      total_campaigns: project.campaigns.length,
      total_tasks: totalTasks,
      total_task_submissions: totalTaskSubmissions,
      total_draw_entries: totalDrawEntries,
      total_claims: totalClaims,
      campaigns: project.campaigns.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        tasks: c.tasks.length,
        submissions: c.tasks.reduce((sum, t) => sum + t.submissions.length, 0),
        draw_entries: c.draws.reduce((sum, d) => sum + d.entries.length, 0),
      })),
    };
  }
}
