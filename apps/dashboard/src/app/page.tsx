'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [projects] = useState([
    { id: '1', name: 'Sample Project', status: 'verified', campaigns: 3 },
  ]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">A</span>
              </div>
              <span className="text-xl font-bold">AlphaQuest</span>
            </Link>
            <span className="text-gray-400 ml-2">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/projects/new" className="text-sm text-gray-300 hover:text-white">
              + New Project
            </Link>
            <button className="px-4 py-2 bg-primary-600 rounded-lg text-sm">Connect Wallet</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-gray-400">Manage your Web3 project campaigns</p>
        </div>

        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="block p-6 bg-card rounded-xl border border-border hover:border-primary-500 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-gray-400">{project.campaigns} campaigns</p>
                </div>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">
                  {project.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
