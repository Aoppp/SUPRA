import { useState, useEffect, useCallback } from 'react';
import {
  adminLogin, isLoggedIn, logout, getAdminStats, getAdminVisits,
  getTopMolecules, getTrendData,
  downloadExportVisits,
} from '../api/client';
import type { AdminStats, VisitLog, TopMolecule, TrendDailyPoint } from '../types';
import Toast from '../components/Toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Date helpers ──
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type ChartType = 'line' | 'bar';
type ExpandedCard = 'visits' | 'ips' | 'todayVisits' | 'todayIps' | 'molecules' | 'totalViews' | null;

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Date range
  const [rangePreset, setRangePreset] = useState('7d');
  const [dateFrom, setDateFrom] = useState(daysAgo(6));
  const [dateTo, setDateTo] = useState(todayStr());

  // Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [trend, setTrend] = useState<TrendDailyPoint[]>([]);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [visitsPage, setVisitsPage] = useState(1);
  const [visitsTotal, setVisitsTotal] = useState(0);
  const [topMolecules, setTopMolecules] = useState<TopMolecule[]>([]);
  const [toast, setToast] = useState('');

  // UI state
  const [expanded, setExpanded] = useState<ExpandedCard>(null);
  const [chartType, setChartType] = useState<ChartType>('line');

  const pageSize = 20;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, v, m] = await Promise.all([
        getAdminStats(dateFrom, dateTo),
        getTrendData(dateFrom, dateTo),
        getAdminVisits(1, pageSize, dateFrom, dateTo),
        getTopMolecules(20),
      ]);
      setStats(s);
      setTrend(t.daily);
      setVisits(v.results);
      setVisitsTotal(v.total);
      setVisitsPage(1);
      setTopMolecules(m);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('401')) {
        logout();
        setAuthenticated(false);
      }
      setToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (authenticated) fetchAll();
  }, [authenticated, fetchAll]);

  function applyPreset(preset: string) {
    setRangePreset(preset);
    const to = todayStr();
    switch (preset) {
      case '7d': setDateFrom(daysAgo(6)); setDateTo(to); break;
      case '30d': setDateFrom(daysAgo(29)); setDateTo(to); break;
      case '90d': setDateFrom(daysAgo(89)); setDateTo(to); break;
      case 'all': setDateFrom('2026-01-01'); setDateTo(to); break;
    }
  }

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
      const v = await getAdminVisits(p, pageSize, dateFrom, dateTo);
      setVisits(v.results);
      setVisitsTotal(v.total);
      setVisitsPage(p);
    } catch { setToast('Failed to load visits'); }
  }

  function toggleCard(card: ExpandedCard) {
    setExpanded(expanded === card ? null : card);
  }

  // ── Login ──
  if (!authenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 w-full max-w-sm border border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">Admin Login</h1>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer">
            Login
          </button>
        </form>
      </div>
    );
  }

  // ── Chart colors ──
  const chartColors = {
    visits: '#3b82f6',
    ips: '#10b981',
    views: '#f59e0b',
    grid: '#e2e8f0',
    text: '#94a3b8',
  };

  const totalPages = Math.ceil(visitsTotal / pageSize);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && <Toast message={toast} type="error" onDone={() => setToast('')} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadExportVisits()} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
            Export CSV
          </button>
          <button onClick={() => { logout(); setAuthenticated(false); setPassword(''); }} className="px-3 py-1.5 text-sm bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors cursor-pointer">
            Logout
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-sm text-slate-500 dark:text-slate-400">Range:</span>
        {['7d', '30d', '90d', 'all'].map(p => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1 text-sm rounded border cursor-pointer transition-colors ${
              rangePreset === p
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {p === '7d' ? '7 days' : p === '30d' ? '30 days' : p === '90d' ? '90 days' : 'All'}
          </button>
        ))}
        <input
          type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setRangePreset('custom'); }}
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        />
        <span className="text-slate-400 text-sm">to</span>
        <input
          type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setRangePreset('custom'); }}
          className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        />
      </div>

      {loading && !stats ? (
        <div className="text-slate-500">Loading...</div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <StatCard
                label="Total Visits" value={stats.total_visits}
                active={expanded === 'visits'} onClick={() => toggleCard('visits')}
              />
              <StatCard
                label="Unique IPs" value={stats.unique_ips}
                active={expanded === 'ips'} onClick={() => toggleCard('ips')}
              />
              <StatCard
                label="Today Visits" value={stats.today_visits}
                active={expanded === 'todayVisits'} onClick={() => toggleCard('todayVisits')}
              />
              <StatCard
                label="Today IPs" value={stats.today_unique_ips}
                active={expanded === 'todayIps'} onClick={() => toggleCard('todayIps')}
              />
              <StatCard
                label="Molecules" value={stats.total_assemblies}
                active={expanded === 'molecules'} onClick={() => toggleCard('molecules')}
              />
              <StatCard
                label="Total Views" value={stats.total_molecule_views}
                active={expanded === 'totalViews'} onClick={() => toggleCard('totalViews')}
              />
            </div>
          )}

          {/* Expanded Detail Panel */}
          {expanded && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-300 dark:border-blue-700 p-6 mb-8 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {expanded === 'visits' && 'Visit Trend'}
                  {expanded === 'ips' && 'Unique IP Trend'}
                  {expanded === 'todayVisits' && 'Daily Visits'}
                  {expanded === 'todayIps' && 'Daily Unique IPs'}
                  {expanded === 'molecules' && 'Top Molecules'}
                  {expanded === 'totalViews' && 'Molecule Views Trend'}
                </h2>
                <div className="flex items-center gap-2">
                  {expanded !== 'molecules' && (
                    <>
                      <button
                        onClick={() => setChartType('line')}
                        className={`px-2 py-1 text-xs rounded cursor-pointer ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                      >
                        Line
                      </button>
                      <button
                        onClick={() => setChartType('bar')}
                        className={`px-2 py-1 text-xs rounded cursor-pointer ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                      >
                        Bar
                      </button>
                    </>
                  )}
                  <button onClick={() => setExpanded(null)} className="ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer text-lg leading-none">
                    &times;
                  </button>
                </div>
              </div>

              {expanded === 'molecules' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 text-slate-500">#</th>
                        <th className="text-left py-2 text-slate-500">Name</th>
                        <th className="text-right py-2 text-slate-500">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMolecules.slice(0, 10).map((m, i) => (
                        <tr key={m.id} className="border-b border-slate-100 dark:border-slate-700/50">
                          <td className="py-2 text-slate-400">{i + 1}</td>
                          <td className="py-2 text-slate-700 dark:text-slate-300 max-w-[300px] truncate" title={m.name}>{m.name}</td>
                          <td className="py-2 text-right font-mono text-slate-600 dark:text-slate-400">{m.view_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart data={getChartData(trend)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.text }} tickFormatter={fmtDate} />
                        <YAxis tick={{ fontSize: 11, fill: chartColors.text }} allowDecimals={false} />
                        <Tooltip labelFormatter={fmtDate} />
                        <Legend />
                        {getChartLines(expanded, chartColors)}
                      </LineChart>
                    ) : (
                      <BarChart data={getChartData(trend)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.text }} tickFormatter={fmtDate} />
                        <YAxis tick={{ fontSize: 11, fill: chartColors.text }} allowDecimals={false} />
                        <Tooltip labelFormatter={fmtDate} />
                        <Legend />
                        {getChartBars(expanded, chartColors)}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Summary text */}
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {expanded === 'visits' && `Total: ${stats?.total_visits.toLocaleString()} visits in selected range`}
                {expanded === 'ips' && `Total: ${stats?.unique_ips.toLocaleString()} unique IPs in selected range`}
                {expanded === 'todayVisits' && `Today: ${stats?.today_visits.toLocaleString()} visits`}
                {expanded === 'todayIps' && `Today: ${stats?.today_unique_ips.toLocaleString()} unique IPs`}
                {expanded === 'totalViews' && `Total: ${stats?.total_molecule_views.toLocaleString()} molecule views`}
              </div>
            </div>
          )}

          {/* Main Trend Chart (always visible) */}
          {trend.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Visits & Unique IPs (Selected Range)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.text }} tickFormatter={fmtDate} />
                    <YAxis tick={{ fontSize: 11, fill: chartColors.text }} allowDecimals={false} />
                    <Tooltip labelFormatter={fmtDate} />
                    <Legend />
                    <Line type="monotone" dataKey="visits" stroke={chartColors.visits} name="Visits" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="unique_ips" stroke={chartColors.ips} name="Unique IPs" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bottom tables: Top Molecules + Recent Visits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Top Molecules</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 text-slate-500">#</th>
                      <th className="text-left py-2 text-slate-500">Name</th>
                      <th className="text-right py-2 text-slate-500">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMolecules.map((m, i) => (
                      <tr key={m.id} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-2 text-slate-400">{i + 1}</td>
                        <td className="py-2 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={m.name}>{m.name}</td>
                        <td className="py-2 text-right font-mono text-slate-600 dark:text-slate-400">{m.view_count}</td>
                      </tr>
                    ))}
                    {topMolecules.length === 0 && <tr><td colSpan={3} className="py-4 text-slate-400 text-center">No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Recent Visits</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 text-slate-500">IP</th>
                      <th className="text-left py-2 text-slate-500">Path</th>
                      <th className="text-right py-2 text-slate-500">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map(v => (
                      <tr key={v.id} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{v.ip_address}</td>
                        <td className="py-2 text-xs text-slate-500 max-w-[180px] truncate" title={v.path}>{v.path}</td>
                        <td className="py-2 text-right text-xs text-slate-400 whitespace-nowrap">{v.created_at ? new Date(v.created_at).toLocaleString() : ''}</td>
                      </tr>
                    ))}
                    {visits.length === 0 && <tr><td colSpan={3} className="py-4 text-slate-400 text-center">No data</td></tr>}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => loadVisitsPage(visitsPage - 1)} disabled={visitsPage <= 1}
                    className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 disabled:opacity-30 cursor-pointer">Prev</button>
                  <span className="text-sm text-slate-500">{visitsPage} / {totalPages}</span>
                  <button onClick={() => loadVisitsPage(visitsPage + 1)} disabled={visitsPage >= totalPages}
                    className="px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 disabled:opacity-30 cursor-pointer">Next</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Helper components ──
function StatCard({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-lg border p-4 text-center cursor-pointer transition-all hover:shadow-md ${
        active
          ? 'border-blue-500 dark:border-blue-400 shadow-md ring-1 ring-blue-500'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value.toLocaleString()}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </button>
  );
}

// ── Chart helpers ──
function fmtDate(d: unknown) {
  return typeof d === 'string' ? d.slice(5) : String(d);
}

function getChartData(trend: TrendDailyPoint[]) {
  if (!trend) return [];
  return trend.map(d => ({
    date: d.date,
    visits: d.visits,
    ips: d.unique_ips,
  }));
}

function getChartLines(card: ExpandedCard, colors: Record<string, string>) {
  if (card === 'todayVisits') return <Line type="monotone" dataKey="visits" stroke={colors.visits} name="Visits" strokeWidth={2} dot={{ r: 3 }} />;
  if (card === 'todayIps') return <Line type="monotone" dataKey="ips" stroke={colors.ips} name="IPs" strokeWidth={2} dot={{ r: 3 }} />;
  return (
    <>
      <Line type="monotone" dataKey="visits" stroke={colors.visits} name="Visits" strokeWidth={2} dot={{ r: 3 }} />
      <Line type="monotone" dataKey="ips" stroke={colors.ips} name="IPs" strokeWidth={2} dot={{ r: 3 }} />
    </>
  );
}

function getChartBars(card: ExpandedCard, colors: Record<string, string>) {
  if (card === 'todayVisits') return <Bar dataKey="visits" fill={colors.visits} name="Visits" />;
  if (card === 'todayIps') return <Bar dataKey="ips" fill={colors.ips} name="IPs" />;
  return (
    <>
      <Bar dataKey="visits" fill={colors.visits} name="Visits" />
      <Bar dataKey="ips" fill={colors.ips} name="IPs" />
    </>
  );
}
