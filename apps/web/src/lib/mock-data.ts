export type TaskStatus = 'available' | 'pending' | 'completed' | 'failed';
export type TaskType = 'daily-checkin' | 'quiz' | 'onchain' | 'manual-review';
export type DrawStatus = 'open' | 'sealed' | 'drawing' | 'claimable';

export type Task = {
  id: string;
  title: string;
  projectId: string;
  campaignId: string;
  projectName: string;
  type: TaskType;
  status: TaskStatus;
  reward: number;
  description: string;
  steps: string[];
  riskLevel: 'low' | 'medium' | 'high';
};

export type Campaign = {
  id: string;
  projectId: string;
  title: string;
  projectName: string;
  description: string;
  progress: number;
  participants: number;
  tasks: string[];
  drawId: string;
};

export type DrawPool = {
  id: string;
  campaignId: string;
  title: string;
  prize: string;
  status: DrawStatus;
  requiredPoints: number;
  totalTickets: number;
  userTicketStart: number;
  userTicketEnd: number;
  contractAddress: string;
  merkleRoot: string;
  txHash: string;
  winningTicket?: number;
};

export const userProfile = {
  wallet: '0x7a91...4f2C',
  nickname: 'Quest Builder',
  level: 'Explorer Lv.3',
  referralCode: 'AQ-7A91',
  points: { available: 1280, pending: 320, locked: 200, totalEarned: 4200 },
};

export const projects = [
  { id: 'orbital', name: 'Orbital Finance', category: 'DeFi', website: 'https://orbital.example', followers: 12840 },
  { id: 'nova', name: 'Nova Guild', category: 'Community', website: 'https://nova.example', followers: 7340 },
];

export const campaigns: Campaign[] = [
  {
    id: 'orbital-season-1',
    projectId: 'orbital',
    title: 'Orbital Season 1 Growth Sprint',
    projectName: 'Orbital Finance',
    description: 'Complete educational and on-chain tasks to earn auditable AlphaQuest points.',
    progress: 64,
    participants: 1832,
    tasks: ['daily-checkin', 'orbital-quiz', 'swap-proof'],
    drawId: 'draw-orbital-1',
  },
  {
    id: 'nova-community',
    projectId: 'nova',
    title: 'Nova Community Launch',
    projectName: 'Nova Guild',
    description: 'Invite verified members and submit community proof for pending referral rewards.',
    progress: 42,
    participants: 924,
    tasks: ['daily-checkin', 'manual-community-proof'],
    drawId: 'draw-nova-1',
  },
];

export const tasks: Task[] = [
  {
    id: 'daily-checkin',
    title: 'Daily check-in',
    projectId: 'orbital',
    campaignId: 'orbital-season-1',
    projectName: 'AlphaQuest',
    type: 'daily-checkin',
    status: 'available',
    reward: 20,
    description: 'Sign in once per day. Repeated submissions are blocked by account and wallet.',
    steps: ['Connect wallet', 'Open the task', 'Press check-in', 'Point transaction is recorded'],
    riskLevel: 'low',
  },
  {
    id: 'orbital-quiz',
    title: 'Orbital protocol quiz',
    projectId: 'orbital',
    campaignId: 'orbital-season-1',
    projectName: 'Orbital Finance',
    type: 'quiz',
    status: 'pending',
    reward: 120,
    description: 'Answer product questions. Points become available after automated scoring.',
    steps: ['Read campaign rules', 'Answer 5 questions', 'Submit once', 'Receive scored point ledger entry'],
    riskLevel: 'low',
  },
  {
    id: 'swap-proof',
    title: 'Submit on-chain interaction',
    projectId: 'orbital',
    campaignId: 'orbital-season-1',
    projectName: 'Orbital Finance',
    type: 'onchain',
    status: 'available',
    reward: 260,
    description: 'Submit a transaction hash for chainId and contract event validation.',
    steps: ['Interact with approved contract', 'Copy transaction hash', 'Submit hash', 'Indexer verifies event'],
    riskLevel: 'medium',
  },
  {
    id: 'manual-community-proof',
    title: 'Community proof review',
    projectId: 'nova',
    campaignId: 'nova-community',
    projectName: 'Nova Guild',
    type: 'manual-review',
    status: 'completed',
    reward: 180,
    description: 'Upload a screenshot or link. Reviewers approve before points are released.',
    steps: ['Join community', 'Capture proof', 'Submit link', 'Wait for review'],
    riskLevel: 'medium',
  },
];

export const drawPools: DrawPool[] = [
  {
    id: 'draw-orbital-1',
    campaignId: 'orbital-season-1',
    title: 'Orbital Fair Reward Pool',
    prize: 'Hardware wallet bundle',
    status: 'open',
    requiredPoints: 200,
    totalTickets: 12890,
    userTicketStart: 8400,
    userTicketEnd: 8419,
    contractAddress: '0xD1aW...9B12',
    merkleRoot: '0x9c7f...aa21',
    txHash: '0x55b0...e91c',
  },
  {
    id: 'draw-nova-1',
    campaignId: 'nova-community',
    title: 'Nova Community Reward Pool',
    prize: 'Partner NFT allowlist',
    status: 'claimable',
    requiredPoints: 100,
    totalTickets: 6400,
    userTicketStart: 3200,
    userTicketEnd: 3206,
    contractAddress: '0xC1a1...7A90',
    merkleRoot: '0xa8f1...10bf',
    txHash: '0x19ac...713a',
    winningTicket: 3203,
  },
];

export const pointTransactions = [
  { id: 'pt-1', label: 'Daily check-in', amount: 20, status: 'available', time: 'Today 09:12' },
  { id: 'pt-2', label: 'Orbital quiz scored', amount: 120, status: 'pending', time: 'Yesterday 18:20' },
  { id: 'pt-3', label: 'Reward pool ticket lock', amount: -200, status: 'locked', time: 'Yesterday 16:40' },
  { id: 'pt-4', label: 'Referral reward release', amount: 80, status: 'available', time: 'Apr 30 11:08' },
];

export const referrals = [
  { wallet: '0x81C2...5aD0', status: 'active', reward: 80 },
  { wallet: '0x19ab...A010', status: 'pending risk delay', reward: 60 },
  { wallet: '0x4A8f...90Bc', status: 'needs first task', reward: 0 },
];

export function getTask(id: string) { return tasks.find((task) => task.id === id) ?? tasks[0]; }
export function getCampaign(id: string) { return campaigns.find((campaign) => campaign.id === id) ?? campaigns[0]; }
export function getProject(id: string) { return projects.find((project) => project.id === id) ?? projects[0]; }
export function getDrawPool(id: string) { return drawPools.find((draw) => draw.id === id) ?? drawPools[0]; }
