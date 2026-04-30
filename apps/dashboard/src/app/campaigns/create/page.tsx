'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Task {
  title: string;
  description: string;
  type: 'signin' | 'social' | 'quiz' | 'onchain' | 'manual';
  points: number;
  maxCompletions: number;
}

interface Campaign {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  tasks: Task[];
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaign, setCampaign] = useState<Campaign>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    tasks: [],
  });
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    type: 'social',
    points: 10,
    maxCompletions: 1,
  });

  const handleAddTask = () => {
    if (newTask.title && newTask.points > 0) {
      setCampaign((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
      setNewTask({
        title: '',
        description: '',
        type: 'social',
        points: 10,
        maxCompletions: 1,
      });
    }
  };

  const handleRemoveTask = (index: number) => {
    setCampaign((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/dashboard/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to create campaign');
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPoints = campaign.tasks.reduce((sum, task) => sum + task.points * task.maxCompletions, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">
              ← Back
            </Link>
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center font-bold">
              A
            </div>
            <span className="font-semibold">Create Campaign</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {['Basic Info', 'Tasks', 'Review'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step > index + 1
                      ? 'bg-cyan-600 text-white'
                      : step === index + 1
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {step > index + 1 ? '✓' : index + 1}
                </div>
                <span className={`ml-2 ${step === index + 1 ? 'text-white' : 'text-gray-400'}`}>
                  {label}
                </span>
                {index < 2 && <div className="w-16 h-px bg-gray-800 mx-4" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={campaign.title}
                  onChange={(e) => setCampaign((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-cyan-600"
                  placeholder="e.g., Summer Token Launch"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={campaign.description}
                  onChange={(e) => setCampaign((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-cyan-600 h-32"
                  placeholder="Describe your campaign..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={campaign.startDate}
                    onChange={(e) => setCampaign((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={campaign.endDate}
                    onChange={(e) => setCampaign((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!campaign.title || !campaign.description}
                  className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Add Tasks
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                <h3 className="font-semibold mb-4">Add New Task</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Task Title</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-600"
                      placeholder="e.g., Follow Twitter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={newTask.description}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-600"
                      placeholder="How to complete this task"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Type</label>
                      <select
                        value={newTask.type}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, type: e.target.value as Task['type'] }))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-600"
                      >
                        <option value="signin">Sign-in</option>
                        <option value="social">Social</option>
                        <option value="quiz">Quiz</option>
                        <option value="onchain">On-chain</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Points</label>
                      <input
                        type="number"
                        value={newTask.points}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Max Completions</label>
                      <input
                        type="number"
                        value={newTask.maxCompletions}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, maxCompletions: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-600"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddTask}
                    disabled={!newTask.title}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Add Task
                  </button>
                </div>
              </div>

              {campaign.tasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Added Tasks ({campaign.tasks.length})</h3>
                  {campaign.tasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-400">
                          {task.type} • {task.points} pts • Max: {task.maxCompletions}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveTask(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={campaign.tasks.length === 0}
                  className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold mb-4">{campaign.title}</h3>
                <p className="text-gray-400 mb-4">{campaign.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Start:</span> {campaign.startDate || 'Not set'}
                  </div>
                  <div>
                    <span className="text-gray-400">End:</span> {campaign.endDate || 'Not set'}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold">Tasks ({campaign.tasks.length})</h3>
                  <span className="text-cyan-400 font-semibold">Total: {totalPoints} AP</span>
                </div>
                <div className="space-y-3">
                  {campaign.tasks.map((task, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{task.title}</span>
                      <span className="text-gray-400">{task.points} pts × {task.maxCompletions}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
