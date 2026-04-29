import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(data: {
    name: string;
    website?: string;
    logo?: string;
    description?: string;
    owner_user_id: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  }) {
    return this.prisma.project.create({
      data: {
        ...data,
        verification_status: 'pending',
        risk_level: 'low',
      },
    });
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
