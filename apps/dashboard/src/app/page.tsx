'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Project = { id: string; name: string; verification_status: string; risk_level: string; campaigns?: unknown[] };
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState('Loading projects from API...');
  const [token, setToken] = useState('');
  const [name, setName] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProjects(data);
      setStatus(data.length ? 'Live API connected' : 'API connected, no projects yet');
    } catch (err: any) { setStatus(`API unavailable: ${err.message || err}`); }
  };

  useEffect(() => { load(); }, []);

  const createProject = async () => {
    if (!token || !name) { setStatus('JWT token and project name are required'); return; }
    try {
      const res = await fetch(`${API_BASE}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error(await res.text());
      setName('');
      setStatus('Project created through API');
      await load();
    } catch (err: any) { setStatus(`Create failed: ${err.message || err}`); }
  };

  return <div className="min-h-screen">
    <header className="border-b border-border bg-card"><div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><span className="font-bold text-white">A</span></div><span className="text-xl font-bold">AlphaQuest</span><span className="text-gray-400 ml-2">Dashboard</span></Link>
    </div></header>
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8"><h1 className="text-2xl font-bold">Project Dashboard</h1><p className="text-gray-400">{status}</p></div>
      <div className="mb-8 p-6 bg-card rounded-xl border border-border grid gap-3">
        <h2 className="font-semibold">Create project via real API</h2>
        <input className="bg-background border border-border rounded px-3 py-2" placeholder="Bearer JWT from wallet login" value={token} onChange={(e) => setToken(e.target.value)} />
        <input className="bg-background border border-border rounded px-3 py-2" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="px-4 py-2 bg-primary-600 rounded-lg text-sm w-fit" onClick={createProject}>Create Project</button>
      </div>
      <div className="grid gap-4">{projects.map((project) => <div key={project.id} className="block p-6 bg-card rounded-xl border border-border"><div className="flex items-center justify-between"><div><h3 className="font-semibold">{project.name}</h3><p className="text-sm text-gray-400">{project.campaigns?.length || 0} campaigns · risk {project.risk_level}</p></div><span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">{project.verification_status}</span></div></div>)}</div>
    </main>
  </div>;
}
