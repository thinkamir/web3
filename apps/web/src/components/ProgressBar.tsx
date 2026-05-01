export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-800">
      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-400" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
