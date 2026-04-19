import { useMemo } from "react";
import Papa from "papaparse";
import { format } from "date-fns";
import { useRealBackendStore as useAppStore } from "../hooks/useRealBackendStore";

function AdminPage() {
  const { bounties, submissions, claims, leaderboard, transactions } = useAppStore();

  const rows = useMemo(
    () =>
      submissions.map((s) => ({
        id: s.id,
        bountyId: s.bountyId,
        verdict: s.verdict,
        confidence: s.confidence,
        submittedAt: s.submittedAt,
      })),
    [submissions]
  );

  const exportCsv = () => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `verde-admin-export-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-card">
          <div>
            <h1 className="text-3xl font-semibold text-verde-700">Verde Admin Dashboard</h1>
            <p className="text-sm text-zinc-500">Bounty operations, leaderboard, and exports</p>
          </div>
          <button onClick={exportCsv} className="rounded-xl bg-verde-600 px-4 py-2 text-sm font-semibold text-white">
            Export Claims CSV
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-card"><div className="text-sm text-zinc-500">Active Bounties</div><div className="text-3xl font-semibold">{bounties.filter((b) => b.isActive).length}</div></div>
          <div className="rounded-2xl bg-white p-4 shadow-card"><div className="text-sm text-zinc-500">Approved Claims</div><div className="text-3xl font-semibold">{claims.length}</div></div>
          <div className="rounded-2xl bg-white p-4 shadow-card"><div className="text-sm text-zinc-500">Submissions</div><div className="text-3xl font-semibold">{submissions.length}</div></div>
          <div className="rounded-2xl bg-white p-4 shadow-card"><div className="text-sm text-zinc-500">Transactions</div><div className="text-3xl font-semibold">{transactions.length}</div></div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 text-xl font-semibold">Preloaded Demo Bounties</h2>
          <div className="space-y-2">
            {bounties.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-100 px-3 py-2">
                <div className="font-medium">{b.title}</div>
                <div className="text-sm text-zinc-600">{b.theme} · SDG {b.sdgTag} · {b.coinReward} coins</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 text-xl font-semibold">Top 10 Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.slice().sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 10).map((entry, i) => (
              <div key={entry.id} className="flex justify-between rounded-xl bg-zinc-100 px-3 py-2">
                <span>{i + 1}. {entry.displayName}</span>
                <span>{entry.totalEarned} coins · {entry.approvedCount} approved</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="text-xl font-semibold">V2 Integrity Note</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Planned V2 adds barcode-then-throw video verification for anti-cheat. Current prototype intentionally stays photo-only for demo reliability.
          </p>
        </section>
      </div>
    </main>
  );
}

export default AdminPage;
