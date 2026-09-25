import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users, TruckIcon, CheckCircle2, Clock, AlertTriangle, Flame,
  BarChart3, Search, Filter, ChevronDown, ChevronUp, X,
  Download, ArrowUpDown, Eye, RefreshCw, MapPin, Phone,
  TrendingUp, Activity, AlertOctagon, Star, FileText
} from 'lucide-react';
import { getToken } from '../auth/adminAuth';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ExportReportPanel from '../components/Performance/ExportReportPanel';

const API = 'http://localhost:5000';

// ─── Score badge ─────────────────────────────────────────────────────────────
function ScoreBadge({ score, band }) {
  const colorMap = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    red: 'bg-red-100 text-red-800 border-red-300',
  };
  const dotMap = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };
  const color = band?.color || 'gray';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorMap[color] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
      <span className={`w-2 h-2 rounded-full ${dotMap[color] || 'bg-gray-400'}`} />
      {score}% · {band?.label || 'N/A'}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Active: 'bg-green-100 text-green-800 border-green-300',
    Inactive: 'bg-gray-100 text-gray-700 border-gray-300',
    Unassigned: 'bg-slate-100 text-slate-600 border-slate-200',
    Delayed: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

// ─── Simple SVG bar chart ────────────────────────────────────────────────────
function BarChart({ data, xKey, barKey, color = '#16a34a', label }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No data available</p>;
  const max = Math.max(...data.map((d) => d[barKey] || 0), 1);
  const chartH = 140;
  const barW = Math.max(20, Math.min(48, (500 / data.length) - 8));
  const gap = 8;
  const totalW = data.length * (barW + gap);
  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(totalW + 20, 300)} height={chartH + 40} style={{ minWidth: '100%' }}>
        {data.map((d, i) => {
          const val = d[barKey] || 0;
          const barH = Math.max(4, (val / max) * chartH);
          const x = i * (barW + gap) + 10;
          const y = chartH - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx={4} opacity={0.85} />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="600">{val || ''}</text>
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize={10} fill="#6b7280">{String(d[xKey] || '').slice(0, 8)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Simple multi-line area chart (weekly) ───────────────────────────────────
function WeeklyLineChart({ data, collectorNames }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No data available</p>;
  const w = 500; const h = 150; const pad = 30;
  const innerW = w - pad * 2; const innerH = h - pad * 2;
  const maxVal = Math.max(...data.map((d) => d.total || 0), 1);
  const colors = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

  const namesToShow = collectorNames && collectorNames.length > 0 ? collectorNames.slice(0, 5) : ['total'];
  const getPoints = (key) =>
    data.map((d, i) => {
      const x = pad + (i / (data.length - 1)) * innerW;
      const y = pad + innerH - ((d[key] || 0) / maxVal) * innerH;
      return `${x},${y}`;
    }).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 300, maxHeight: 180 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
          <line key={i} x1={pad} y1={pad + innerH * frac} x2={w - pad} y2={pad + innerH * frac}
            stroke="#e5e7eb" strokeWidth={1} />
        ))}
        {/* Lines per name */}
        {namesToShow.map((name, ci) => (
          <polyline key={name} points={getPoints(name)} fill="none"
            stroke={colors[ci % colors.length]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* X axis labels */}
        {data.map((d, i) => {
          const x = pad + (i / Math.max(data.length - 1, 1)) * innerW;
          return <text key={i} x={x} y={h - 6} textAnchor="middle" fontSize={10} fill="#6b7280">{d.day}</text>;
        })}
        {/* Dots */}
        {namesToShow.map((name, ci) =>
          data.map((d, i) => {
            const x = pad + (i / Math.max(data.length - 1, 1)) * innerW;
            const y = pad + innerH - ((d[name] || 0) / maxVal) * innerH;
            return <circle key={`${name}-${i}`} cx={x} cy={y} r={3.5} fill={colors[ci % colors.length]} />;
          })
        )}
      </svg>
      {/* Legend */}
      {collectorNames && collectorNames.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-2 justify-center">
          {namesToShow.map((name, ci) => (
            <span key={name} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-1.5 rounded inline-block" style={{ backgroundColor: colors[ci % colors.length] }} />
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Horizontal bar chart ────────────────────────────────────────────────────
function HorizBarChart({ data, labelKey, valueKey, color = '#2563eb' }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No data</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-28 truncate text-gray-700 font-medium text-right text-xs">{d[labelKey]}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-1 text-white text-xs font-bold transition-all"
              style={{ width: `${Math.max(6, ((d[valueKey] || 0) / max) * 100)}%`, backgroundColor: color }}
            >
              {(d[valueKey] || 0) > 0 ? d[valueKey] : ''}
            </div>
          </div>
          <span className="w-8 text-xs font-bold text-gray-600 text-right">{d[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Collector Detail Modal ───────────────────────────────────────────────────
function CollectorDetailModal({ collectorId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/admin/performance/collector/${collectorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        setData(d.collector);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [collectorId]);

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-10 shadow-xl"><LoadingSpinner /></div>
    </div>
  );
  if (!data) return null;

  const { label: scoreLabelText, color: scoreColor } = data.scoreBand || {};
  const scoreColorMap = {
    green: 'text-green-700 bg-green-50 border-green-200',
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    orange: 'text-orange-700 bg-orange-50 border-orange-200',
    red: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {(data.name || data.mobile || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-heading">{data.name || 'Unnamed Collector'}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} /> {data.mobile}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score card */}
          <div className={`rounded-xl border p-4 flex items-center justify-between ${scoreColorMap[scoreColor] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Performance Score</p>
              <p className="text-4xl font-bold mt-1">{data.score}%</p>
              <p className="text-sm font-semibold mt-1">{scoreLabelText}</p>
            </div>
            <Star size={48} className="opacity-20" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Today's Collections", value: data.todayCount, color: 'text-green-700' },
              { label: "This Week", value: data.weekCount, color: 'text-blue-700' },
              { label: "This Month", value: data.monthCount, color: 'text-purple-700' },
              { label: "Missed Today", value: data.missed, color: 'text-red-700' },
              { label: "Assigned Bins", value: data.assignedBinCount, color: 'text-gray-800' },
              { label: "Avg. Time", value: `${data.avgMinutes} min`, color: 'text-gray-800' },
              { label: "Overflow Handled", value: data.overflowHandled, color: 'text-orange-700' },
              { label: "Delayed", value: data.delayed, color: 'text-yellow-700' },
            ].map((item) => (
              <div key={item.label} className="stat-card py-3 px-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Assigned bins */}
          {data.assignedBins && data.assignedBins.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-heading mb-2">Assigned Bins</h4>
              <div className="flex flex-wrap gap-2">
                {data.assignedBins.map((bin) => (
                  <span key={bin.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-800 text-xs font-semibold border border-green-200">
                    <MapPin size={11} /> {bin.id} · {bin.location}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weekly trend */}
          {data.weeklyTrend && (
            <div className="modern-card p-4">
              <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" /> Weekly Trend
              </h4>
              <div className="flex items-end gap-2 h-16">
                {data.weeklyTrend.map((d, i) => {
                  const max = Math.max(...data.weeklyTrend.map((x) => x.count), 1);
                  const pct = (d.count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-600 font-semibold">{d.count || ''}</span>
                      <div className="w-full bg-gray-100 rounded-t" style={{ height: 40 }}>
                        <div className="w-full bg-green-500 rounded-t transition-all" style={{ height: `${Math.max(pct, d.count > 0 ? 8 : 0)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collection history */}
          <div>
            <h4 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
              <Activity size={16} className="text-blue-600" /> Collection History (latest 100)
            </h4>
            {data.history && data.history.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Date', 'Time', 'Bin ID', 'Location', 'Status'].map((h) => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((rec) => {
                      const dt = new Date(rec.collectedAt);
                      return (
                        <tr key={rec._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 text-gray-700">{dt.toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-gray-700">{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-3 py-2 font-semibold text-heading">{rec.binId}</td>
                          <td className="px-3 py-2 text-gray-700 max-w-32 truncate">{rec.location}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle2 size={10} /> {rec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl border border-gray-200">No collections recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Performance Page ────────────────────────────────────────────────────
const PerformancePage = () => {
  const [summary, setSummary] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [charts, setCharts] = useState(null);
  const [attentionAlerts, setAttentionAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterScore, setFilterScore] = useState('All');
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const token = getToken();

  const areas = useMemo(() => Array.from(new Set(collectors.map(c => c.assignedArea).filter(Boolean))), [collectors]);

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [sumRes, chartRes, alertRes] = await Promise.all([
        fetch(`${API}/admin/performance/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/admin/performance/charts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/admin/performance/attention`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [sumData, chartData, alertData] = await Promise.all([
        sumRes.json(),
        chartRes.json(),
        alertRes.json(),
      ]);

      setSummary(sumData.summary || null);
      setCollectors(sumData.collectors || []);
      setCharts(chartData || null);
      setAttentionAlerts(alertData.alerts || []);
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAll(false), 30000);
    return () => clearInterval(interval);
  }, [loadAll]);

  // Filtering & sorting
  const filteredCollectors = useMemo(() => {
    let result = [...collectors];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q) || c.assignedArea?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'All') result = result.filter((c) => c.status === filterStatus);
    if (filterScore === 'Excellent') result = result.filter((c) => c.score >= 90);
    else if (filterScore === 'Good') result = result.filter((c) => c.score >= 75 && c.score < 90);
    else if (filterScore === 'Needs Improvement') result = result.filter((c) => c.score >= 60 && c.score < 75);
    else if (filterScore === 'Poor') result = result.filter((c) => c.score < 60);

    result.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'score') diff = a.score - b.score;
      else if (sortBy === 'collected') diff = a.binsCollectedAllTime - b.binsCollectedAllTime;
      else if (sortBy === 'missed') diff = a.missed - b.missed;
      else if (sortBy === 'name') diff = a.name.localeCompare(b.name);
      return sortDir === 'desc' ? -diff : diff;
    });
    return result;
  }, [collectors, searchTerm, filterStatus, filterScore, sortBy, sortDir]);

  // Export CSV
  const exportCSV = () => {
    const headers = ['Name', 'Mobile', 'Area', 'Assigned Bins', 'Total Collected', 'Today', 'Missed', 'Avg Time', 'Score', 'Band', 'Status'];
    const rows = filteredCollectors.map((c) => [
      `"${c.name}"`, c.mobile, `"${c.assignedArea}"`, c.assignedBinCount,
      c.binsCollectedAllTime, c.binsCollectedToday, c.missed, `${c.avgMinutes} min`,
      `${c.score}%`, `"${c.scoreBand?.label}"`, c.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collector-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortBy(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortDir === 'desc' ? <ChevronDown size={14} className="text-green-600" /> : <ChevronUp size={14} className="text-green-600" />;
  };

  if (loading) return <LoadingSpinner size="large" />;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'table', label: 'Collector Table', icon: Users },
    { id: 'charts', label: 'Charts', icon: TrendingUp },
    { id: 'alerts', label: `Alerts ${attentionAlerts.length > 0 ? `(${attentionAlerts.length})` : ''}`, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading flex items-center gap-2">
            <TruckIcon size={24} className="text-green-600" />
            Collector Performance
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time performance metrics for all waste collectors
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={exportCSV} className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3">
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-3 font-semibold shadow-sm"
          >
            <FileText size={14} /> 🖨 Print Preview / PDF
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: 'Total Collectors', value: summary.totalCollectors, icon: Users, color: 'from-blue-500 to-blue-600', text: 'text-blue-700' },
            { label: 'Active Collectors', value: summary.activeCollectors, icon: Activity, color: 'from-green-500 to-green-600', text: 'text-green-700' },
            { label: 'Collections Today', value: summary.collectionsToday, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', text: 'text-emerald-700' },
            { label: 'Avg. Time', value: `${summary.avgCollectionTime} min`, icon: Clock, color: 'from-cyan-500 to-cyan-600', text: 'text-cyan-700' },
            { label: 'Missed', value: summary.missedCollections, icon: AlertTriangle, color: 'from-orange-500 to-orange-600', text: 'text-orange-700' },
            { label: 'Overflow Handled', value: summary.overflowHandled, icon: Flame, color: 'from-red-500 to-red-600', text: 'text-red-700' },
            { label: 'Avg. Score', value: `${summary.avgPerformanceScore}%`, icon: Star, color: 'from-purple-500 to-purple-600', text: 'text-purple-700' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="stat-card flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 leading-tight">{card.label}</p>
                  <div className={`w-9 h-9 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center shadow-md`}>
                    <Icon size={16} className="text-white" />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score distribution */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: '🟢 Excellent (90–100%)', color: 'border-green-300 bg-green-50', textColor: 'text-green-800', filterVal: 'Excellent' },
              { label: '🟡 Good (75–89%)', color: 'border-yellow-300 bg-yellow-50', textColor: 'text-yellow-800', filterVal: 'Good' },
              { label: '🟠 Needs Improvement (60–74%)', color: 'border-orange-300 bg-orange-50', textColor: 'text-orange-800', filterVal: 'Needs Improvement' },
              { label: '🔴 Poor (Below 60%)', color: 'border-red-300 bg-red-50', textColor: 'text-red-800', filterVal: 'Poor' },
            ].map((band) => {
              const count = collectors.filter((c) => c.scoreBand?.label === band.filterVal).length;
              return (
                <button
                  key={band.filterVal}
                  onClick={() => { setFilterScore(band.filterVal); setActiveTab('table'); }}
                  className={`modern-card p-4 border-2 ${band.color} text-left hover:shadow-md transition-all`}
                >
                  <p className={`text-xs font-semibold ${band.textColor} mb-1`}>{band.label}</p>
                  <p className={`text-3xl font-bold ${band.textColor}`}>{count}</p>
                  <p className={`text-xs ${band.textColor} opacity-70 mt-1`}>collectors</p>
                </button>
              );
            })}
          </div>

          {/* Quick collector cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collectors.slice(0, 6).map((c) => (
              <div
                key={c._id}
                className="modern-card p-5 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedCollector(String(c._id))}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {(c.name || c.mobile || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-heading text-sm">{c.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500">{c.mobile}</p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <ScoreBadge score={c.score} band={c.scoreBand} />
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Today</p>
                    <p className="text-lg font-bold text-green-700">{c.binsCollectedToday}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-blue-700">{c.binsCollectedAllTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Missed</p>
                    <p className="text-lg font-bold text-red-700">{c.missed}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={11} />
                  <span className="truncate">{c.assignedArea || '—'}</span>
                </div>
              </div>
            ))}
          </div>
          {collectors.length > 6 && (
            <button
              className="btn-secondary text-sm py-2 px-4 w-full"
              onClick={() => setActiveTab('table')}
            >
              View all {collectors.length} collectors →
            </button>
          )}
        </div>
      )}

      {/* ── Table Tab ── */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="modern-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input-field w-full pl-9 text-sm py-2"
                  placeholder="Search collector, area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-500" />
                <select className="input-field text-sm py-2" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
                <select className="input-field text-sm py-2" value={filterScore} onChange={(e) => setFilterScore(e.target.value)}>
                  <option value="All">All Scores</option>
                  <option value="Excellent">Excellent (90%+)</option>
                  <option value="Good">Good (75–89%)</option>
                  <option value="Needs Improvement">Needs Improvement (60–74%)</option>
                  <option value="Poor">Poor (&lt;60%)</option>
                </select>
              </div>
              {(searchTerm || filterStatus !== 'All' || filterScore !== 'All') && (
                <button
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                  onClick={() => { setSearchTerm(''); setFilterStatus('All'); setFilterScore('All'); }}
                >
                  <X size={13} /> Clear
                </button>
              )}
              <span className="text-xs text-gray-500 ml-auto">{filteredCollectors.length} of {collectors.length}</span>
            </div>
          </div>

          {/* Table */}
          <div className="modern-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Collector</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Area</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bins Assigned</th>
                    <th
                      className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => toggleSort('collected')}
                    >
                      <span className="inline-flex items-center gap-1">Total Collected <SortIcon field="collected" /></span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Today</th>
                    <th
                      className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => toggleSort('missed')}
                    >
                      <span className="inline-flex items-center gap-1">Missed <SortIcon field="missed" /></span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Time</th>
                    <th
                      className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => toggleSort('score')}
                    >
                      <span className="inline-flex items-center gap-1">Score <SortIcon field="score" /></span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCollectors.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-10 text-gray-500">No collectors match your filters</td></tr>
                  ) : filteredCollectors.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                            {(c.name || c.mobile).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-heading text-sm">{c.name || 'Unnamed'}</p>
                            <p className="text-xs text-gray-500">{c.mobile}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-32 truncate text-xs">{c.assignedArea || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{c.assignedBinCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{c.binsCollectedAllTime}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{c.binsCollectedToday}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-700">{c.missed}</td>
                      <td className="px-4 py-3 text-right text-gray-600 text-xs">{c.avgMinutes} min</td>
                      <td className="px-4 py-3 text-right"><ScoreBadge score={c.score} band={c.scoreBand} /></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedCollector(String(c._id))}
                          className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Tab ── */}
      {activeTab === 'charts' && charts && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Performance */}
            <div className="modern-card p-5">
              <h3 className="text-sm font-bold text-heading mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" /> 📈 Weekly Collector Performance
              </h3>
              <WeeklyLineChart data={charts.weeklyData} collectorNames={charts.collectorNames} />
            </div>

            {/* Collector Comparison */}
            <div className="modern-card p-5">
              <h3 className="text-sm font-bold text-heading mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" /> 📊 Collector Comparison (Total Collected)
              </h3>
              <BarChart
                data={charts.collectorComparison}
                xKey="name"
                barKey="collected"
                color="#2563eb"
              />
            </div>

            {/* Avg Collection Time */}
            <div className="modern-card p-5">
              <h3 className="text-sm font-bold text-heading mb-4 flex items-center gap-2">
                <Clock size={16} className="text-cyan-600" /> ⏱️ Average Collection Time
              </h3>
              <HorizBarChart
                data={charts.avgTimeComparison}
                labelKey="name"
                valueKey="avgMinutes"
                color="#0891b2"
              />
            </div>

            {/* Area-wise Performance */}
            <div className="modern-card p-5">
              <h3 className="text-sm font-bold text-heading mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-purple-600" /> 📍 Area-wise Collection Performance
              </h3>
              <HorizBarChart
                data={charts.areaPerformance}
                labelKey="area"
                valueKey="collected"
                color="#7c3aed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Alerts Tab ── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon size={18} className="text-red-600" />
            <h2 className="text-lg font-bold text-heading">Attention Required</h2>
          </div>

          {attentionAlerts.length === 0 ? (
            <div className="modern-card p-10 text-center">
              <CheckCircle2 size={40} className="mx-auto text-green-600 mb-3" />
              <p className="font-semibold text-heading">All clear — no alerts right now</p>
              <p className="text-sm text-gray-500 mt-1">Collectors and routes are performing well</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionAlerts.map((alert, i) => {
                const severityMap = {
                  red: 'border-red-300 bg-red-50',
                  orange: 'border-orange-300 bg-orange-50',
                  yellow: 'border-yellow-300 bg-yellow-50',
                };
                const iconMap = {
                  red: <AlertOctagon size={20} className="text-red-600 flex-shrink-0" />,
                  orange: <AlertTriangle size={20} className="text-orange-600 flex-shrink-0" />,
                  yellow: <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />,
                };
                return (
                  <div
                    key={i}
                    className={`modern-card p-4 border-l-4 flex items-center gap-3 ${severityMap[alert.severity] || 'border-gray-300 bg-gray-50'} cursor-pointer hover:shadow-md transition-all`}
                    onClick={() => {
                      if (alert.collectorId) setSelectedCollector(alert.collectorId);
                      else if (alert.type === 'overflow' || alert.type === 'area') setActiveTab('table');
                    }}
                  >
                    {iconMap[alert.severity]}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-heading">{alert.message}</p>
                      {alert.collectorName && <p className="text-xs text-gray-500 mt-0.5">Collector: {alert.collectorName}</p>}
                      {alert.area && !alert.collectorName && <p className="text-xs text-gray-500 mt-0.5">Area: {alert.area}</p>}
                    </div>
                    <span className="text-xs text-gray-400 capitalize px-2 py-1 rounded bg-white border border-gray-200 font-medium">{alert.type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Collector Detail Modal ── */}
      {selectedCollector && (
        <CollectorDetailModal
          collectorId={selectedCollector}
          onClose={() => setSelectedCollector(null)}
        />
      )}

      {/* ── Export & Print Performance Report Modal ── */}
      <ExportReportPanel
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        collectors={collectors}
        areas={areas}
      />
    </div>
  );
};

export default PerformancePage;
