import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CampaignMutation = {
  title?: string;
  description?: string;
  status?: string;
  start_time?: Date;
  end_time?: Date;
  region_restriction?: string[];
  risk_level?: string;
  reward_config?: any;
  risk_config?: any;
  terms?: string;
};

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    project_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.campaign.findMany({
      where: {
        ...(filters.project_id && { project_id: filters.project_id }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            logo: true,
            verification_status: true,
          },
        },
        tasks: true,
        draws: true,
        _count: {
          select: { tasks: true, draws: true },
        },
      },
      take: Number(filters.limit) || 50,
      skip: Number(filters.offset) || 0,
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
            twitter: true,
            telegram: true,
            discord: true,
            verification_status: true,
          },
        },
        tasks: {
          where: { status: 'available' },
          orderBy: { reward_points: 'desc' },
        },
        draws: {
          where: { status: { in: ['open', 'filled', 'scheduled'] } },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private async assertProjectMember(projectId: string, userId: string, roles: string[] = ['owner', 'admin']) {
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

  private async assertCampaignMember(campaignId: string, userId: string, roles: string[] = ['owner', 'admin']) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { project_id: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.assertProjectMember(campaign.project_id, userId, roles);
  }

  async createForUser(userId: string, data: {
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
    await this.assertProjectMember(data.project_id, userId);
    return this.create(data);
  }

  async create(data: {
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
    return this.prisma.campaign.create({
      data: {
        ...data,
        status: 'draft',
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateForUser(campaignId: string, userId: string, data: CampaignMutation) {
    await this.assertCampaignMember(campaignId, userId);
    return this.update(campaignId, data);
  }

  async update(campaignId: string, data: CampaignMutation) {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async submitForReviewForUser(campaignId: string, userId: string) {
    await this.assertCampaignMember(campaignId, userId);
    return this.submitForReview(campaignId);
  }

  async submitForReview(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'pending_review' },
    });
  }

  async publish(campaignId: string) {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'open' },
    });
  }

  async getAnalyticsForUser(campaignId: string, userId: string) {
    await this.assertCampaignMember(campaignId, userId, ['owner', 'admin', 'viewer']);
    return this.getAnalytics(campaignId);
  }

  async getAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
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
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const totalSubmissions = campaign.tasks.reduce(
      (sum, task) => sum + task.submissions.length,
      0,
    );

    const uniqueUsers = new Set(
      campaign.tasks.flatMap(task =>
        task.submissions.map(s => s.user_id),
      ),
    );

    const totalDrawEntries = campaign.draws.reduce(
      (sum, draw) => sum + draw.entries.length,
      0,
    );

    const totalClaims = campaign.draws.reduce(
      (sum, draw) => sum + draw.claims.length,
      0,
    );

    return {
      campaign_id: campaignId,
      total_tasks: campaign.tasks.length,
      total_submissions: totalSubmissions,
      unique_participants: uniqueUsers.size,
      total_draw_entries: totalDrawEntries,
      total_claims: totalClaims,
      tasks: campaign.tasks.map(task => ({
        task_id: task.id,
        title: task.title,
        submissions: task.submissions.length,
      })),
    };
  }
}
