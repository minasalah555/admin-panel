import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || e.message || 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-lg font-medium text-slate-600">Loading dashboard…</p>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-[15px] text-rose-800">
        {error}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total orders',
      value: stats?.total_orders ?? '—',
      accent: 'from-violet-500 to-indigo-600',
    },
    {
      label: 'Total revenue',
      value: stats != null ? `$${Number(stats.total_revenue).toFixed(2)}` : '—',
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Pending orders',
      value: stats?.pending_orders ?? '—',
      accent: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Products in catalog',
      value: stats?.available_products ?? '—',
      accent: 'from-fuchsia-500 to-purple-600',
    },
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of orders, revenue, and inventory</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div
              className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${c.accent} opacity-20 blur-2xl transition group-hover:opacity-30`}
            />
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{c.value}</p>
            <div
              className={`mt-4 h-1 w-12 rounded-full bg-gradient-to-r ${c.accent}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
