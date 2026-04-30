'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Input } from '@/components/Input';
import { Header } from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  type: string;
  participants: number;
  status: string;
}

interface TaskCompletionModalProps {
  task: Task;
  onClose: () => void;
  onComplete: (proof: { txHash?: string; proofUrl?: string }) => Promise<void>;
}

function TaskCompletionModal({ task, onClose, onComplete }: TaskCompletionModalProps) {
  const [txHash, setTxHash] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(
        task.type === 'onchain'
          ? { txHash }
          : { proofUrl }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Complete Task</h2>
        <p className="text-gray-400 mb-4">{task.title}</p>

        {task.type === 'onchain' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Transaction Hash</label>
              <Input
                placeholder="0x..."
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-500">
              Please complete the swap transaction and submit the tx hash.
            </p>
          </div>
        )}

        {task.type === 'social' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Proof URL</label>
              <Input
                placeholder="Link to your follow/like/repost"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-500">
              Please complete the social action and provide a link as proof.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (task.type === 'onchain' && !txHash) ||
              (task.type === 'social' && !proofUrl)
            }
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { address, isConnected } = useWallet();

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const url = filter === 'all'
        ? '/api/tasks'
        : `/api/tasks?type=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = (task: Task) => {
    if (task.type === 'signin' || task.type === 'manual') {
      completeTask(task, {});
    } else {
      setSelectedTask(task);
    }
  };

  const completeTask = async (task: Task, proof: { txHash?: string; proofUrl?: string }) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          wallet: address,
          ...proof,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCompletedTaskIds((prev) => new Set([...Array.from(prev), task.id]));
        alert(data.message);
      } else {
        alert(data.error || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task');
    } finally {
      setSelectedTask(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading tasks...</p>
          </div>
        ) : (
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
                  {completedTaskIds.has(task.id) ? (
                    <Button className="w-full" disabled>
                      Completed
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleStartTask(task)}
                      disabled={!isConnected}
                    >
                      {isConnected ? 'Start Task' : 'Connect Wallet'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredTasks.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">No tasks found</p>
          </div>
        )}
      </main>

      {selectedTask && (
        <TaskCompletionModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={(proof) => completeTask(selectedTask, proof)}
        />
      )}
    </>
  );
}
