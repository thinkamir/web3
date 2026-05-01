export function TransactionStatus({ label, hash, status }: { label: string; hash: string; status: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 text-sm">
      <div className="flex items-center justify-between gap-3"><span className="text-gray-400">{label}</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">{status}</span></div>
      <p className="mt-2 break-all font-mono text-gray-300">{hash}</p>
    </div>
  );
}
