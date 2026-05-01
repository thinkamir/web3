import { ForbiddenException } from '@nestjs/common';
import { CampaignService } from './campaign.service';

describe('CampaignService', () => {
  const prisma: any = {
    project: {
      findUnique: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
    },
    campaign: {
      create: jest.fn(async ({ data }) => ({ id: 'campaign-1', ...data })),
      findUnique: jest.fn(),
      update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    },
  };

  const service = new CampaignService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects createForUser when user is not a project owner or member', async () => {
    prisma.project.findUnique.mockResolvedValueOnce({ owner_user_id: 'owner-1' });
    prisma.projectMember.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.createForUser('user-2', {
        project_id: 'project-1',
        title: 'Launch campaign',
        description: 'Sprint 1 test campaign',
        start_time: new Date('2026-05-01T00:00:00Z'),
        end_time: new Date('2026-05-31T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.campaign.create).not.toHaveBeenCalled();
  });

  it('creates draft campaign for an authorized project owner', async () => {
    const payload = {
      project_id: 'project-1',
      title: 'Launch campaign',
      description: 'Sprint 1 test campaign',
      start_time: new Date('2026-05-01T00:00:00Z'),
      end_time: new Date('2026-05-31T00:00:00Z'),
    };

    prisma.project.findUnique.mockResolvedValueOnce({ owner_user_id: 'user-1' });

    await service.createForUser('user-1', payload);

    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...payload,
        status: 'draft',
      }),
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });
  });

  it('aggregates campaign analytics across tasks, participants, and draws', async () => {
    prisma.campaign.findUnique.mockResolvedValueOnce({
      tasks: [
        {
          id: 'task-1',
          title: 'Follow on X',
          submissions: [
            { user_id: 'user-1' },
            { user_id: 'user-2' },
          ],
        },
        {
          id: 'task-2',
          title: 'Join Discord',
          submissions: [
            { user_id: 'user-2' },
            { user_id: 'user-3' },
          ],
        },
      ],
      draws: [
        {
          entries: [{ id: 'entry-1' }, { id: 'entry-2' }],
          claims: [{ id: 'claim-1' }],
        },
        {
          entries: [{ id: 'entry-3' }],
          claims: [{ id: 'claim-2' }, { id: 'claim-3' }],
        },
      ],
    });

    await expect(service.getAnalytics('campaign-1')).resolves.toEqual({
      campaign_id: 'campaign-1',
      total_tasks: 2,
      total_submissions: 4,
      unique_participants: 3,
      total_draw_entries: 3,
      total_claims: 3,
      tasks: [
        {
          task_id: 'task-1',
          title: 'Follow on X',
          submissions: 2,
        },
        {
          task_id: 'task-2',
          title: 'Join Discord',
          submissions: 2,
        },
      ],
    });
  });
});
