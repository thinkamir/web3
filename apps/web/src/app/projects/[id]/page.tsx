import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import { AppShell } from '@/components/AppShell';
import { CampaignCard } from '@/components/CampaignCard';
import { campaigns, getProject } from '@/lib/mock-data';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = getProject(params.id);
  const projectCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
  return <AppShell><Card><CardHeader><CardTitle>{project.name}</CardTitle></CardHeader><CardContent className="space-y-2 text-gray-400"><p>{project.category} project · {project.followers.toLocaleString()} followers</p><Link className="text-primary-300" href={project.website}>Official website</Link></CardContent></Card><h2 className="mt-8 text-2xl font-bold">Campaigns</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{projectCampaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div></AppShell>;
}
