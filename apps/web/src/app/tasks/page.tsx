'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Input } from '@/components/Input';
import { Header } from '@/components/Header';

const mockTasks = [
  { id: '1', title: 'Daily Sign-in', description: 'Sign in to earn points', points: 10, type: 'signin', participants: 1234 },
  { id: '2', title: 'Follow Twitter', description: 'Follow project Twitter', points: 50, type: 'social', participants: 856 },
  { id: '3', title: 'Join Discord', description: 'Join project Discord', points: 100, type: 'social', participants: 543 },
  { id: '4', title: 'Complete Quiz', description: 'Answer quiz questions', points: 30, type: 'quiz', participants: 321 },
  { id: '5', title: 'On-chain Swap', description: 'Complete a swap transaction', points: 200, type: 'onchain', participants: 156 },
  { id: '6', title: 'Submit Feedback', description: 'Submit project feedback', points: 50, type: 'manual', participants: 89 },
];

export default function TasksPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredTasks = mockTasks.filter(task => {
    if (filter !== 'all' && task.type !== filter) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'signin', 'social', 'quiz', 'onchain', 'manual'].map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{task.title}</CardTitle>
                  <span className="text-xs px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded">
                    {task.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">{task.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-400">{task.participants} participants</span>
                  <span className="text-cyan-400 font-semibold">+{task.points} AP</span>
                </div>
                <Button className="w-full">Start Task</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No tasks found</p>
          </div>
        )}
      </main>
    </>
  );
}
