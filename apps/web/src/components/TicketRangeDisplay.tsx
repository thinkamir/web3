export function TicketRangeDisplay({ start, end }: { start: number; end: number }) {
  return (
    <div className="rounded-xl border border-primary-900 bg-primary-950/30 p-4">
      <p className="text-xs uppercase tracking-wide text-primary-300">Your ticket range</p>
      <p className="mt-2 font-mono text-2xl font-bold">#{start} - #{end}</p>
      <p className="mt-1 text-xs text-gray-500">Generated from locked points and included in the Merkle root.</p>
    </div>
  );
}
