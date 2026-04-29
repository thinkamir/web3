import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const user1 = await prisma.user.create({
    data: {
      wallet: '0x1234567890123456789012345678901234567890',
      username: 'alice',
      email: 'alice@example.com',
      referral_code: 'ALICE2024',
      inviter_id: null,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      wallet: '0x2345678901234567890123456789012345678901',
      username: 'bob',
      email: 'bob@example.com',
      referral_code: 'BOB2024',
      inviter_id: user1.id,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      wallet: '0x3456789012345678901234567890123456789012',
      username: 'charlie',
      email: 'charlie@example.com',
      referral_code: 'CHARLIE2024',
      risk_score: 95,
      status: 'suspended',
    },
  });

  console.log('Created users:', { user1: user1.id, user2: user2.id, user3: user3.id });

  const project1 = await prisma.project.create({
    data: {
      name: 'DeFi Protocol X',
      description: 'Next generation DeFi protocol with innovative yield strategies',
      website: 'https://defi-protocol-x.example.com',
      owner_user_id: user1.id,
      verification_status: 'verified',
      risk_level: 'low',
      twitter: '@DeFiProtocolX',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'NFT Collection Y',
      description: 'Exclusive digital art collection featuring renowned artists',
      website: 'https://nft-collection-y.example.com',
      owner_user_id: user2.id,
      verification_status: 'pending',
      risk_level: 'medium',
      twitter: '@NFTCollectionY',
    },
  });

  console.log('Created projects:', { project1: project1.id, project2: project2.id });

  const campaign1 = await prisma.campaign.create({
    data: {
      project_id: project1.id,
      title: 'Yield Farming Campaign',
      description: 'Stake tokens to earn rewards and points',
      status: 'active',
      start_time: new Date('2024-03-01'),
      end_time: new Date('2024-06-01'),
      risk_level: 'low',
      reward_config: { total_budget: 100000, per_user_limit: 5000 },
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      project_id: project1.id,
      title: 'Referral Program',
      description: 'Invite friends to earn bonus points',
      status: 'active',
      start_time: new Date('2024-02-15'),
      end_time: new Date('2024-05-15'),
      risk_level: 'low',
      reward_config: { referrer_reward: 100, invitee_reward: 50 },
    },
  });

  console.log('Created campaigns:', { campaign1: campaign1.id, campaign2: campaign2.id });

  const task1 = await prisma.task.create({
    data: {
      campaign_id: campaign1.id,
      type: 'social',
      title: 'Follow on X',
      description: 'Follow the project on Twitter',
      reward_points: 50,
      verification_type: 'twitter_follow',
      requirements: { twitter_handle: '@DeFiProtocolX' },
      per_user_limit: 1,
      status: 'available',
    },
  });

  const task2 = await prisma.task.create({
    data: {
      campaign_id: campaign1.id,
      type: 'social',
      title: 'Join Discord',
      description: 'Join the project Discord server',
      reward_points: 100,
      verification_type: 'discord_join',
      requirements: { discord_server_id: '123456789' },
      per_user_limit: 1,
      status: 'available',
    },
  });

  const task3 = await prisma.task.create({
    data: {
      campaign_id: campaign1.id,
      type: 'daily',
      title: 'Daily Sign-in',
      description: 'Sign in daily to earn points',
      reward_points: 10,
      verification_type: 'auto',
      per_user_limit: 1,
      status: 'available',
    },
  });

  console.log('Created tasks:', { task1: task1.id, task2: task2.id, task3: task3.id });

  await prisma.pointTransaction.create({
    data: {
      user_id: user1.id,
      amount: 1000,
      direction: 'in',
      point_type: 'earned',
      status: 'available',
      source_type: 'campaign_signup_bonus',
      balance_after: 1000,
    },
  });

  await prisma.pointTransaction.create({
    data: {
      user_id: user1.id,
      amount: 50,
      direction: 'in',
      point_type: 'earned',
      status: 'available',
      source_type: 'task_completion',
      source_id: task1.id,
      balance_after: 1050,
    },
  });

  console.log('Created point transactions');

  const draw1 = await prisma.draw.create({
    data: {
      campaign_id: campaign1.id,
      title: 'NFT Giveaway',
      description: 'Win exclusive NFT from the collection',
      type: 'nft_giveaway',
      status: 'active',
      prize_description: '1 Exclusive NFT',
      prize_amount: 1,
      prize_contract: '0xabcd1234abcd1234abcd1234abcd1234abcd1234',
      target_points: 2000,
      max_per_user: 5,
      points_per_ticket: 100,
      free_entry_enabled: false,
      start_time: new Date('2024-03-01'),
      end_time: new Date('2024-03-15'),
      total_tickets: 1234,
    },
  });

  console.log('Created draw:', draw1.id);

  await prisma.referral.create({
    data: {
      referrer_id: user1.id,
      invitee_id: user2.id,
      referral_type: 'signup',
      reward_amount: 100,
      status: 'completed',
      confirmed_at: new Date(),
    },
  });

  console.log('Created referral');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
