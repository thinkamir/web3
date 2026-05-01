import { ForbiddenException } from '@nestjs/common';
import { ProjectService } from './project.service';

describe('ProjectService RBAC', () => {
  const prisma: any = {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(async ({ data }) => data),
      create: jest.fn(async ({ data }) => data),
    },
    projectMember: {
      findUnique: jest.fn(),
    },
  };
  const service = new ProjectService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('creates project owned by authenticated user and adds owner membership', async () => {
    await service.create('user-1', { name: 'Demo' });
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Demo',
        owner_user_id: 'user-1',
        project_members: { create: { user_id: 'user-1', role: 'owner' } },
      }),
    });
  });

  it('allows owner to update project', async () => {
    prisma.project.findUnique.mockResolvedValueOnce({ owner_user_id: 'user-1' });
    await service.updateForUser('project-1', 'user-1', { name: 'Next' });
    expect(prisma.project.update).toHaveBeenCalledWith({ where: { id: 'project-1' }, data: { name: 'Next' } });
  });

  it('rejects unrelated user updates', async () => {
    prisma.project.findUnique.mockResolvedValueOnce({ owner_user_id: 'owner' });
    prisma.projectMember.findUnique.mockResolvedValueOnce(null);
    await expect(service.updateForUser('project-1', 'user-2', { name: 'Hack' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
