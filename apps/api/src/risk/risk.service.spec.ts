import { RiskService } from './risk.service';

describe('RiskService', () => {
  let prisma: any;
  let service: RiskService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
      },
      taskSubmission: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      referral: {
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
      riskEvent: {
        create: jest.fn(async ({ data }) => ({ id: 'risk-event-1', ...data })),
      },
    };

    service = new RiskService(prisma);
  });

  it('scores a user from referrals and repeated task completions, then persists the risk score', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      referrals_sent: [
        ...Array.from({ length: 9 }, (_, i) => ({ id: `ref-ok-${i}`, status: 'completed' })),
        { id: 'ref-flagged-1', status: 'flagged' },
        { id: 'ref-flagged-2', status: 'flagged' },
      ],
      task_submissions: [
        ...Array.from({ length: 6 }, () => ({ task_id: 'task-rapid' })),
        { task_id: 'task-normal' },
      ],
      draw_entries: [],
    });

    const result = await service.evaluateUser('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      include: {
        referrals_sent: true,
        task_submissions: {
          where: { status: 'completed' },
        },
        draw_entries: true,
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { risk_score: 45 },
    });
    expect(result).toEqual({
      risk_score: 45,
      factors: {
        too_many_referrals_sent: true,
        suspicious_referrals_sent: 2,
        rapid_completions: 1,
      },
    });
  });

  it('does not add threshold-driven user risk factors at the referral and completion boundaries', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-2',
      referrals_sent: Array.from({ length: 10 }, (_, i) => ({ id: `ref-${i}`, status: 'completed' })),
      task_submissions: [
        ...Array.from({ length: 5 }, () => ({ task_id: 'task-at-threshold' })),
        { task_id: 'task-other' },
      ],
      draw_entries: [],
    });

    const result = await service.evaluateUser('user-2');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { risk_score: 0 },
    });
    expect(result).toEqual({
      risk_score: 0,
      factors: {},
    });
  });

  it('flags a task submission for a high-risk user with rapid recent submissions and records a risk event', async () => {
    prisma.taskSubmission.findUnique.mockResolvedValueOnce({
      id: 'submission-1',
      user_id: 'user-1',
      user: { id: 'user-1', risk_score: 70 },
    });
    prisma.taskSubmission.count.mockResolvedValueOnce(11);

    const result = await service.evaluateTaskSubmission('submission-1');

    expect(prisma.taskSubmission.findUnique).toHaveBeenCalledWith({
      where: { id: 'submission-1' },
      include: { user: true },
    });
    expect(prisma.taskSubmission.count).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
        created_at: { gte: expect.any(Date) },
      },
    });
    expect(prisma.riskEvent.create).toHaveBeenCalledWith({
      data: {
        user_id: 'user-1',
        event_type: 'task_submission',
        event_data: {
          submission_id: 'submission-1',
          flags: ['high_risk_user', 'rapid_submissions'],
        },
        risk_score: 50,
      },
    });
    expect(result).toEqual({
      risk_score: 50,
      flags: ['high_risk_user', 'rapid_submissions'],
    });
  });

  it('records a task submission risk event without flags when the user and submission rate are below threshold', async () => {
    prisma.taskSubmission.findUnique.mockResolvedValueOnce({
      id: 'submission-2',
      user_id: 'user-2',
      user: { id: 'user-2', risk_score: 60 },
    });
    prisma.taskSubmission.count.mockResolvedValueOnce(10);

    const result = await service.evaluateTaskSubmission('submission-2');

    expect(prisma.riskEvent.create).toHaveBeenCalledWith({
      data: {
        user_id: 'user-2',
        event_type: 'task_submission',
        event_data: {
          submission_id: 'submission-2',
          flags: [],
        },
        risk_score: 0,
      },
    });
    expect(result).toEqual({
      risk_score: 0,
      flags: [],
    });
  });

  it('flags suspicious referrals above the threshold and records the action', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'referrer-1',
      referrals_sent: [
        ...Array.from({ length: 48 }, (_, i) => ({
          invitee_id: `invitee-ok-${i}`,
          status: 'completed',
        })),
        { invitee_id: 'other-flagged-1', status: 'flagged' },
        { invitee_id: 'other-flagged-2', status: 'flagged' },
        { invitee_id: 'other-flagged-3', status: 'flagged' },
      ],
    });

    const result = await service.evaluateReferral('referrer-1', 'invitee-1');

    expect(prisma.referral.updateMany).toHaveBeenCalledWith({
      where: { referrer_id: 'referrer-1', invitee_id: 'invitee-1' },
      data: { status: 'flagged' },
    });
    expect(prisma.riskEvent.create).toHaveBeenCalledWith({
      data: {
        user_id: 'referrer-1',
        event_type: 'suspicious_referral',
        event_data: { invitee_id: 'invitee-1', score: 70 },
        risk_score: 70,
        action_taken: 'flagged',
      },
    });
    expect(result).toEqual({ risk_score: 70, action: 'flag' });
  });

  it('allows referrals that stay below the suspicious referral threshold', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'referrer-2',
      referrals_sent: [
        ...Array.from({ length: 49 }, (_, i) => ({
          invitee_id: `invitee-ok-${i}`,
          status: 'completed',
        })),
        { invitee_id: 'other-flagged-1', status: 'flagged' },
        { invitee_id: 'other-flagged-2', status: 'flagged' },
      ],
    });

    const result = await service.evaluateReferral('referrer-2', 'invitee-2');

    expect(prisma.referral.updateMany).not.toHaveBeenCalled();
    expect(prisma.riskEvent.create).not.toHaveBeenCalled();
    expect(result).toEqual({ risk_score: 55, action: 'allow' });
  });

  it('freezes a user by updating status and writing the freeze event', async () => {
    await expect(service.freezeUser('user-1', 'manual review')).resolves.toEqual({ status: 'frozen' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { status: 'frozen' },
    });
    expect(prisma.riskEvent.create).toHaveBeenCalledWith({
      data: {
        user_id: 'user-1',
        event_type: 'user_frozen',
        event_data: { reason: 'manual review' },
        action_taken: 'frozen',
      },
    });
  });

  it('unfreezes a user by updating status back to active', async () => {
    await expect(service.unfreezeUser('user-1')).resolves.toEqual({ status: 'active' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { status: 'active' },
    });
  });
});
