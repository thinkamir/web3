'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  totalCampaigns: number;
  totalTasks: number;
  totalParticipants: number;
  totalPointsDistributed: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/dashboard/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogo = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <span className="font-bold">A</span>
            </div>
            <span className="text-xl font-bold">AlphaQuest</span>
            <span className="text-gray-400 ml-2">Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">project@defiswap.io</span>
            <button className="px-4 py-2 bg-cyan-600 rounded-lg text-sm hover:bg-cyan-700">
              Create Campaign
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-gray-400">Manage your Web3 project campaigns</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No projects found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-cyan-600 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center text-xl font-bold">
                      {getLogo(project.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          project.status === 'active'
                            ? 'bg-green-600/20 text-green-400'
                            : project.status === 'pending'
                            ? 'bg-yellow-600/20 text-yellow-400'
                            : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {project.status}
                        </span>
                        <span className="text-sm text-gray-400">
                          {project.totalCampaigns} campaigns
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-lg font-semibold">{project.totalParticipants.toLocaleString()}</p>
                      <p className="text-sm text-gray-400">Participants</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{project.totalTasks}</p>
                      <p className="text-sm text-gray-400">Tasks</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
