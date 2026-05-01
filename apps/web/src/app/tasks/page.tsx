import { AppShell } from '@/components/AppShell';
import { TaskCard } from '@/components/TaskCard';
import { tasks } from '@/lib/mock-data';

export default function TasksPage() {
  return <AppShell><h1 className="text-3xl font-bold">Task center</h1><p className="mt-2 text-gray-400">Four MVP task types: daily check-in, quiz, on-chain proof and manual review.</p><div className="mt-6 grid gap-4 md:grid-cols-2">{tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div></AppShell>;
}
