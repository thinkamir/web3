import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@alphaquest/ui/card';
import type { Task } from '@/lib/mock-data';

export function TaskCard({ task }: { task: Task }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-gray-400">
          <span>{task.projectName}</span><span className="rounded-full bg-gray-800 px-2 py-1">{task.type}</span>
        </div>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-gray-400">{task.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-semibold text-primary-300">+{task.reward} AP</span>
          <Link href={`/tasks/${task.id}`} className="inline-flex h-8 items-center justify-center rounded-lg bg-primary-600 px-3 text-sm font-medium text-white transition-colors hover:bg-primary-700">Open</Link>
        </div>
      </CardContent>
    </Card>
  );
}
