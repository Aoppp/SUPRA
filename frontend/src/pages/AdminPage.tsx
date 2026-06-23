import { useState, useEffect, useCallback } from 'react';
import { adminLogin, isLoggedIn, logout, getAdminStats, getAdminVisits, getTopMolecules, downloadExportVisits, downloadExportMoleculeStats } from '../api/client';
import type { AdminStats, VisitLog, TopMolecule } from '../types';
import Toast from '../components/Toast';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [visitsPage, setVisitsPage] = useState(1);
  const [visitsTotal, setVisitsTotal] = useState(0);
  const [topMolecules, setTopMolecules] = useState<TopMolecule[]>([]);
  const [toast, setToast] = useState('');

  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, v, t] = await Promise.all([
        getAdminStats(),
        getAdminVisits(1, pageSize),
        getTopMolecules(20),
      ]);
      setStats(s);
      setVisits(v.results);
      setVisitsTotal(v.total);
      setVisitsPage(1);
      setTopMolecules(t);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('401')) {
        logout();
        setAuthenticated(false);
      }
      setToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated, fetchData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    try {
      const { token } = await adminLogin(password);
      localStorage.setItem('admin_token', token);
      setAuthenticated(true);
    } catch {
      setLoginError('Wrong password');
    }
  }

  async function loadVisitsPage(p: number) {
    try {
      const v = await getAdminVisits(p, pageSize);
      setVisits(v.results);
      setVisitsTotal(v.total);
      setVisitsPage(p);
    } catch {
      setToast('Failed to load visits');
    }
  }

  async function handleExportVisits() {
    try {
      await downloadExportVisits();
    } catch {
      setToast('Export failed');
    }
  }

  async function handleExportMolecules() {
    try {
      await downloadExportMoleculeStats();
    } catch {
      setToast('Export failed');
    }
  }

  function handleLogout() {
    logout();
    setAuthenticated(false);
    setPassword('');
  }

  // ── Login screen ──
  if (!authenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 w-full max-w-sm border border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // ── Dashboard ──
  const totalPages = Math.ceil(visitsTotal / pageSize);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && <Toast message={toast} type="error" onDone={() => setToast('')} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
        <div className="flex gap-3">
          <button onClick={handleExportVisits} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
            Export Visits CSV
          </button>
          <button onClick={handleExportMolecules} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
            Export Molecule CSV
          </button>
          <button onClick={handleLogout} className="px-3 py-1.5 text-sm bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors cursor-pointer">
            Logout
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="text-slate-500">Loading...</div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Total Visits" value={stats.total_visits} />
              <StatCard label="Unique IPs" value={stats.unique_ips} />
              <StatCard label="Today Visits" value={stats.today_visits} />
              <StatCard label="Today IPs" value={stats.today_unique_ips} />
              <StatCard label="Molecules" value={stats.total_assemblies} />
              <StatCard label="Total Views" value={stats.total_molecule_views} />
            </div>
          )}

          {/* Daily Trend Chart */}
          {stats && stats.daily_trend.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Daily Visits (7 days)</h2>
              <div className="flex items-end gap-2 h-40">
                {stats.daily_trend.map((d) => {
                  const maxCount = Math.max(...stats.daily_trend.map(x => x.count), 1);
                  const height = (d.count / maxCount) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{d.count}</span>
                      <div
                        className="w-full bg-blue-500 rounded-t min-h-[2px]"
                        style={{ height: `${Math.max(height, 1)}%` }}
                      />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Molecules */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Top Molecules</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 text-slate-500 dark:text-slate-400">#</th>
                      <th className="text-left py-2 text-slate-500 dark:text-slate-400">Name</th>
                      <th className="text-right py-2 text-slate-500 dark:text-slate-400">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMolecules.map((m, i) => (
                      <tr key={m.id} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-2 text-slate-400">{i + 1}</td>
                        <td className="py-2 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={m.name}>
                          {m.name}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-600 dark:text-slate-400">{m.view_count}</td>
                      </tr>
                    ))}
                    {topMolecules.length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-slate-400 text-center">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Visits */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Recent Visits</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 text-slate-500 dark:text-slate-400">IP</th>
                      <th className="text-left py-2 text-slate-500 dark:text-slate-400">Path</th>
                      <th className="text-right py-2 text-slate-500 dark:text-slate-400">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{v.ip_address}</td>
                        <td className="py-2 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={v.path}>
                          {v.path}
                        </td>
                        <td className="py-2 text-right text-xs text-slate-400 whitespace-nowrap">
                          {v.created_at ? new Date(v.created_at).toLocaleString() : ''}
                        </td>
                      </tr>
                    ))}
                    {visits.length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-slate-400 text-center">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => loadVisitsPage(visitsPage - 1)}
                    disabled={visitsPage <= 1}
                    className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 disabled:opacity-30 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-slate-500">{visitsPage} / {totalPages}</span>
                  <button
                    onClick={() => loadVisitsPage(visitsPage + 1)}
                    disabled={visitsPage >= totalPages}
                    className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 disabled:opacity-30 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center">
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value.toLocaleString()}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}
