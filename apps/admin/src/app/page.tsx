'use client';

import { useEffect, useMemo, useState } from 'react';

type User = { id: string; wallet: string; role: string; status: string; created_at: string };
type Project = { id: string; name: string; verification_status: string; risk_level: string };
type Campaign = { id: string; title: string; status: string };
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [status, setStatus] = useState('Loading platform data from API...');

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/users?limit=8`).then((r) => r.ok ? r.json() : []),
      fetch(`${API_BASE}/projects?limit=8`).then((r) => r.ok ? r.json() : []),
      fetch(`${API_BASE}/campaigns?limit=8`).then((r) => r.ok ? r.json() : []),
    ]).then(([u, p, c]) => { setUsers(u); setProjects(p); setCampaigns(c); setStatus('Live API connected'); })
      .catch((err) => setStatus(`API unavailable: ${err.message || err}`));
  }, []);

  const activeCampaigns = useMemo(() => campaigns.filter((c) => c.status === 'active').length, [campaigns]);

  return <div className="min-h-screen">
    <header className="border-b border-border bg-card"><div className="container mx-auto px-4 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><span className="font-bold text-white">A</span></div><span className="text-xl font-bold">AlphaQuest</span><span className="text-gray-400 ml-2">Admin</span></div><span className="text-sm text-gray-400">{status}</span></div></header>
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8"><h1 className="text-2xl font-bold">Platform Overview</h1><p className="text-gray-400">Real API-backed operational snapshot.</p></div>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Stat label="Users" value={users.length} />
        <Stat label="Projects" value={projects.length} />
        <Stat label="Campaigns" value={campaigns.length} />
        <Stat label="Active Campaigns" value={activeCampaigns} />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <Panel title="Recent Users">{users.map((u) => <Row key={u.id} left={`${u.wallet?.slice(0, 8)}...${u.wallet?.slice(-4)}`} right={u.status} />)}{!users.length && <p className="text-sm text-gray-400">No users returned.</p>}</Panel>
        <Panel title="Projects">{projects.map((p) => <Row key={p.id} left={p.name} right={p.verification_status} />)}{!projects.length && <p className="text-sm text-gray-400">No projects returned.</p>}</Panel>
        <Panel title="Campaigns">{campaigns.map((c) => <Row key={c.id} left={c.title} right={c.status} />)}{!campaigns.length && <p className="text-sm text-gray-400">No campaigns returned.</p>}</Panel>
      </div>
    </main>
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="p-6 bg-card rounded-xl border border-border"><p className="text-gray-400 text-sm">{label}</p><p className="text-3xl font-bold mt-2">{value}</p></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="p-6 bg-card rounded-xl border border-border"><h3 className="font-semibold mb-4">{title}</h3><div className="space-y-3">{children}</div></div>; }
function Row({ left, right }: { left: string; right: string }) { return <div className="flex items-center justify-between p-3 bg-background rounded-lg"><span className="text-sm">{left}</span><span className="px-2 py-1 bg-primary-600/20 text-primary-400 text-xs rounded">{right}</span></div>; }
