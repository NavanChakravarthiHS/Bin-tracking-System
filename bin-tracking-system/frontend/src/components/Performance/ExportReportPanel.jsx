import { useState, useEffect, useRef } from 'react';
import {
  FileText, Calendar, Download, Printer, X, AlertCircle,
  CheckCircle2, User, MapPin, Loader2, ChevronRight, Eye, RefreshCw, ExternalLink
} from 'lucide-react';
import { getToken } from '../../auth/adminAuth';
import { generatePDF, buildFilename } from '../../utils/pdfGenerator';
import { API_BASE_URL } from '../../config/api';

const API = API_BASE_URL;

const REPORT_TYPES = [
  {
    id: 'daily',
    label: 'Daily Performance',
    icon: '📅',
    description: 'Performance summary for a single day',
  },
  {
    id: 'weekly',
    label: 'Weekly Performance',
    icon: '📆',
    description: 'Performance summary for a 7-day week',
  },
  {
    id: 'monthly',
    label: 'Monthly Performance',
    icon: '🗓️',
    description: 'Monthly performance overview',
  },
  {
    id: 'area_summary',
    label: 'Area-Wise Summary',
    icon: '📍',
    description: 'Area and route performance breakdown',
  },
  {
    id: 'activity_logs',
    label: 'All Collection Activity Logs',
    icon: '📋',
    description: 'Detailed log of all collection events',
  },
  {
    id: 'individual',
    label: 'Individual Collector Report',
    icon: '👷',
    description: 'Full report for a specific collector',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekRange(weekStr) {
  if (!weekStr) return { dateFrom: '', dateTo: '' };
  const [year, week] = weekStr.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekStart = new Date(startOfWeek1);
  weekStart.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    dateFrom: weekStart.toISOString().slice(0, 10),
    dateTo: weekEnd.toISOString().slice(0, 10),
  };
}

function getMonthRange(monthStr) {
  if (!monthStr) return { dateFrom: '', dateTo: '' };
  const [year, month] = monthStr.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── ExportReportPanel Component ──────────────────────────────────────────────
export default function ExportReportPanel({
  isOpen = false,
  onClose = null,
  collectors = [],
  areas: passedAreas = []
}) {
  const [open, setOpen] = useState(isOpen);
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedWeek, setSelectedWeek] = useState('2026-W39');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCollector, setSelectedCollector] = useState('all');
  const [selectedArea, setSelectedArea] = useState('');
  const [areas, setAreas] = useState(passedAreas);

  const [generating, setGenerating] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [noDataMsg, setNoDataMsg] = useState('');

  // Preview state
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewFilename, setPreviewFilename] = useState('');
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'preview'
  const iframeRef = useRef(null);

  const token = getToken();
  const currentType = REPORT_TYPES.find((r) => r.id === reportType);

  // Sync open state with prop
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleCloseModal = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  // Derive unique areas if not provided
  useEffect(() => {
    if (passedAreas.length > 0) {
      setAreas(passedAreas);
      if (!selectedArea && passedAreas.length > 0) setSelectedArea(passedAreas[0]);
      return;
    }
    if (collectors.length > 0) {
      const areaSet = new Set();
      collectors.forEach((c) => {
        if (c.assignedBins) {
          c.assignedBins.forEach((b) => {
            if (b.location) areaSet.add(b.location);
          });
        }
        if (c.assignedArea) {
          c.assignedArea.split(',').forEach((a) => {
            const trimmed = a.trim();
            if (trimmed && trimmed !== '—') areaSet.add(trimmed);
          });
        }
      });
      const derived = [...areaSet].sort();
      setAreas(derived);
      if (!selectedArea && derived.length > 0) setSelectedArea(derived[0]);
    }
  }, [collectors, passedAreas]);

  // Build query params based on exact requirements
  const buildQueryParams = () => {
    let qDateFrom = '';
    let qDateTo = '';
    let reqCollector = selectedCollector;
    let reqArea = selectedArea;

    if (reportType === 'daily') {
      qDateFrom = selectedDate;
      qDateTo = selectedDate;
      reqArea = 'all';
    } else if (reportType === 'weekly') {
      const range = getWeekRange(selectedWeek);
      qDateFrom = range.dateFrom;
      qDateTo = range.dateTo;
      reqArea = 'all';
    } else if (reportType === 'monthly') {
      const range = getMonthRange(selectedMonth);
      qDateFrom = range.dateFrom;
      qDateTo = range.dateTo;
      reqArea = 'all';
    } else if (reportType === 'area_summary') {
      qDateFrom = selectedDate;
      qDateTo = selectedDate;
      reqCollector = 'all';
    } else if (reportType === 'activity_logs') {
      qDateFrom = dateFrom;
      qDateTo = dateTo;
      reqCollector = 'all';
      reqArea = 'all';
    } else if (reportType === 'individual') {
      qDateFrom = selectedDate;
      qDateTo = selectedDate;
      reqArea = 'all';
    }

    return { qDateFrom, qDateTo, reqCollector, reqArea };
  };

  // Validate before generating
  const validate = () => {
    setValidationMsg('');
    setNoDataMsg('');

    if (reportType === 'daily') {
      if (!selectedDate) {
        setValidationMsg('Please select a date before generating the report.');
        return false;
      }
    } else if (reportType === 'weekly') {
      if (!selectedWeek) {
        setValidationMsg('Please select a week before generating the report.');
        return false;
      }
    } else if (reportType === 'monthly') {
      if (!selectedMonth) {
        setValidationMsg('Please select a month before generating the report.');
        return false;
      }
    } else if (reportType === 'area_summary') {
      if (!selectedDate) {
        setValidationMsg('Please select a date before generating the report.');
        return false;
      }
      if (!selectedArea) {
        setValidationMsg('Please select an area/zone before generating the report.');
        return false;
      }
    } else if (reportType === 'activity_logs') {
      if (!dateFrom || !dateTo) {
        setValidationMsg('Please select a valid start date and end date.');
        return false;
      }
      if (new Date(dateFrom) > new Date(dateTo)) {
        setValidationMsg('Start date cannot be after end date.');
        return false;
      }
    } else if (reportType === 'individual') {
      if (!selectedCollector || selectedCollector === 'all' || selectedCollector === '') {
        setValidationMsg('Please select a collector before generating the report.');
        return false;
      }
      if (!selectedDate) {
        setValidationMsg('Please select a date before generating the report.');
        return false;
      }
    }
    return true;
  };

  const handleFetchData = async () => {
    const { qDateFrom, qDateTo, reqCollector, reqArea } = buildQueryParams();

    const params = new URLSearchParams({ type: reportType });
    if (qDateFrom) params.set('dateFrom', qDateFrom);
    if (qDateTo) params.set('dateTo', qDateTo);
    if (reqCollector && reqCollector !== 'all') params.set('collectorId', reqCollector);
    if (reqArea && reqArea !== 'all') params.set('area', reqArea);

    const res = await fetch(`${API}/admin/performance/report?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch report data');
    }

    const data = await res.json();

    const hasCollections = data.collectionLog && data.collectionLog.length > 0;
    const hasCollectors = data.collectorStats && data.collectorStats.length > 0;

    if (!hasCollections && !hasCollectors) {
      setNoDataMsg('No data available for the selected filters.');
      return null;
    }

    return { data, qDateFrom, qDateTo, reqCollector, reqArea };
  };

  const handleGeneratePDF = async () => {
    if (!validate()) return;
    if (generating) return;

    setGenerating(true);
    setValidationMsg('');
    setNoDataMsg('');

    try {
      const result = await handleFetchData();
      if (!result) {
        setGenerating(false);
        return;
      }
      const { data, qDateFrom, qDateTo, reqCollector, reqArea } = result;

      const collectorObj = collectors.find((c) => String(c._id) === reqCollector);
      const collectorName = collectorObj ? (collectorObj.name || collectorObj.mobile) : undefined;

      let periodLabel = '';
      if (reportType === 'daily' || reportType === 'area_summary' || reportType === 'individual') periodLabel = fmtDate(qDateFrom);
      else if (reportType === 'weekly') periodLabel = `${fmtDate(qDateFrom)} – ${fmtDate(qDateTo)}`;
      else if (reportType === 'monthly') periodLabel = new Date(qDateFrom).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      else if (qDateFrom && qDateTo) periodLabel = `${fmtDate(qDateFrom)} – ${fmtDate(qDateTo)}`;

      const filters = {
        type: reportType,
        dateFrom: qDateFrom,
        dateTo: qDateTo,
        collectorId: reqCollector,
        area: reqArea,
        collectorName,
        reportTypeLabel: currentType?.label || reportType,
        period: periodLabel,
      };

      const doc = await generatePDF(filters, data);
      const filename = buildFilename(filters);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);

      setPreviewPdfUrl(url);
      setPreviewFilename(filename);
      setActiveTab('preview');
      window.open(url, '_blank');
    } catch (err) {
      setValidationMsg(err.message || 'Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    if (!validate()) return;
    if (generating) return;

    setGenerating(true);
    setValidationMsg('');
    setNoDataMsg('');

    try {
      const result = await handleFetchData();
      if (!result) {
        setGenerating(false);
        return;
      }
      const { data, qDateFrom, qDateTo, reqCollector, reqArea } = result;

      const collectorObj = collectors.find((c) => String(c._id) === reqCollector);
      const collectorName = collectorObj ? (collectorObj.name || collectorObj.mobile) : undefined;

      const filters = {
        type: reportType,
        dateFrom: qDateFrom,
        dateTo: qDateTo,
        collectorId: reqCollector,
        area: reqArea,
        collectorName,
        reportTypeLabel: currentType?.label || reportType,
      };

      const filename = buildFilename(filters).replace('.pdf', '.csv');
      let csvContent = '';

      if (reportType === 'activity_logs') {
        const headers = ['Date', 'Time', 'Bin ID', 'Location', 'Area', 'Collector', 'Status', 'Duration (min)'];
        const rows = (data.collectionLog || []).map((r) => [
          `"${new Date(r.collectedAt).toLocaleDateString('en-IN')}"`,
          `"${new Date(r.collectedAt).toLocaleTimeString('en-IN')}"`,
          `"${r.binId || ''}"`,
          `"${r.location || ''}"`,
          `"${r.area || r.location || ''}"`,
          `"${r.collectorName || ''}"`,
          '"Completed"',
          '8'
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else {
        const headers = ['Collector Name', 'Mobile', 'Assigned Bins', 'Completed Collections', 'Missed Bins', 'Completion Rate', 'Performance Score', 'Status Band'];
        const rows = (data.collectorStats || []).map((c) => [
          `"${c.name}"`, c.mobile, c.assignedBinCount, c.completed, c.missed, `${c.completionRate}%`, `${c.score}%`, `"${c.scoreBand?.label}"`
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setValidationMsg(err.message || 'Failed to download CSV. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintPreviewDoc = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else if (previewPdfUrl) {
      const win = window.open(previewPdfUrl, '_blank');
      if (win) win.print();
    }
  };

  const handleDownloadDoc = () => {
    if (!previewPdfUrl) return;
    const a = document.createElement('a');
    a.href = previewPdfUrl;
    a.download = previewFilename || 'performance-report.pdf';
    a.click();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-green-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/30 border border-green-500/40 rounded-xl flex items-center justify-center text-green-400 font-bold">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Export & Print Performance Reports
              </h2>
              <p className="text-xs text-green-300/80">
                Official Smart Waste Bin Tracking System Administrative Reports
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation (Config vs Preview) */}
        {previewPdfUrl && (
          <div className="bg-gray-100 border-b border-gray-200 px-6 py-2 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'config'
                    ? 'bg-white text-green-700 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚙️ Report Settings
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white text-green-700 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👁️ Live PDF Preview
              </button>
            </div>
            <span className="text-xs text-gray-500 font-mono truncate max-w-[250px]">
              {previewFilename}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Validation Alert */}
          {validationMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 animate-fade-in">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Validation Error</p>
                <p className="text-xs text-red-700 mt-0.5">{validationMsg}</p>
              </div>
            </div>
          )}

          {/* No Data Alert */}
          {noDataMsg && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 animate-fade-in">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">No Data Available</p>
                <p className="text-xs text-amber-800 mt-0.5">{noDataMsg}</p>
              </div>
            </div>
          )}

          {/* VIEW 1: CONFIG / FILTERS */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* 1. Select Report Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  1. Select Report Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {REPORT_TYPES.map((type) => {
                    const isSelected = reportType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setReportType(type.id);
                          setValidationMsg('');
                          setNoDataMsg('');
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-green-600 bg-green-50/70 shadow-sm ring-2 ring-green-600/20'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{type.icon}</span>
                          {isSelected && <CheckCircle2 size={18} className="text-green-600" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                            {type.label}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                            {type.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Dynamic Report Filters Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  2. Report Filters ({currentType?.label})
                </label>

                {/* 1. DAILY PERFORMANCE: Select Date + Collector */}
                {reportType === 'daily' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Select Date *</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Collector</label>
                      <select
                        value={selectedCollector}
                        onChange={(e) => setSelectedCollector(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Collectors</option>
                        {collectors.map((c) => (
                          <option key={c._id} value={String(c._id)}>
                            {c.name || c.mobile}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 2. WEEKLY PERFORMANCE: Select Week + Collector */}
                {reportType === 'weekly' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Select Week *</label>
                      <input
                        type="week"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      {selectedWeek && (
                        <p className="text-xs text-green-700 mt-1 font-medium">
                          Period: {fmtDate(getWeekRange(selectedWeek).dateFrom)} – {fmtDate(getWeekRange(selectedWeek).dateTo)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Collector</label>
                      <select
                        value={selectedCollector}
                        onChange={(e) => setSelectedCollector(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Collectors</option>
                        {collectors.map((c) => (
                          <option key={c._id} value={String(c._id)}>
                            {c.name || c.mobile}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 3. MONTHLY PERFORMANCE: Select Month + Collector */}
                {reportType === 'monthly' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Select Month *</label>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Collector</label>
                      <select
                        value={selectedCollector}
                        onChange={(e) => setSelectedCollector(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="all">All Collectors</option>
                        {collectors.map((c) => (
                          <option key={c._id} value={String(c._id)}>
                            {c.name || c.mobile}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 4. AREA-WISE SUMMARY: Select Date + Area/Zone */}
                {reportType === 'area_summary' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Select Date *</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Area / Zone *</label>
                      <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">-- Select Area / Zone --</option>
                        <option value="all">All Areas / Zones</option>
                        {areas.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 5. ALL COLLECTION ACTIVITY LOGS: Start Date + End Date */}
                {reportType === 'activity_logs' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}

                {/* 6. INDIVIDUAL COLLECTOR REPORT: Select Date + Collector */}
                {reportType === 'individual' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Collector *</label>
                      <select
                        value={selectedCollector}
                        onChange={(e) => setSelectedCollector(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">-- Select Collector --</option>
                        {collectors.map((c) => (
                          <option key={c._id} value={String(c._id)}>
                            {c.name || c.mobile}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Select Date *</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: LIVE PDF PREVIEW */}
          {activeTab === 'preview' && previewPdfUrl && (
            <div className="space-y-4">
              {/* PDF Toolbar */}
              <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold text-gray-200">A4 Document Preview Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintPreviewDoc}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Printer size={14} /> Print PDF
                  </button>
                  <button
                    onClick={handleDownloadDoc}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Download size={14} /> Download PDF
                  </button>
                  <a
                    href={previewPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink size={14} /> Open in New Tab
                  </a>
                </div>
              </div>

              {/* Embedded PDF iframe */}
              <div className="w-full h-[620px] rounded-xl overflow-hidden border border-gray-300 shadow-inner bg-slate-800 flex items-center justify-center">
                <iframe
                  ref={iframeRef}
                  src={previewPdfUrl}
                  title="Official Report PDF Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <button
            type="button"
            onClick={handleCloseModal}
            className="btn-secondary text-xs py-2 px-4"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {previewPdfUrl && activeTab === 'config' && (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Eye size={14} /> View Previous PDF
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={generating}
              className="btn-secondary text-xs py-2.5 px-4 font-semibold flex items-center gap-2"
            >
              <Download size={16} />
              Download CSV
            </button>

            <button
              type="button"
              onClick={handleGeneratePDF}
              disabled={generating}
              className="btn-primary text-xs py-2.5 px-5 font-bold shadow-md flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Printer size={16} />
                  🖨 Print Preview / PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
