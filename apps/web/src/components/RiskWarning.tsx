export function RiskWarning({ level }: { level: 'low' | 'medium' | 'high' }) {
  const copy = level === 'low' ? 'Normal anti-sybil checks apply.' : level === 'medium' ? 'Submissions may enter manual or delayed review.' : 'High risk activity requires admin review before rewards release.';
  return <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">Risk notice: {copy}</div>;
}
