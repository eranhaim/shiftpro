import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, FileText, Plus, Pencil, Download, Filter, X } from 'lucide-react';
import { getDailySummaries, getSummaryDebts, createDailySummary, updateDailySummary, getChatters } from '../../services/api.js';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

function formatTime(t) {
  if (!t) return '';
  return t.slice(0, 5);
}

function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

const EMPTY_FORM = {
  chatterId: '',
  date: new Date().toISOString().split('T')[0],
  shiftType: 'בוקר',
  incomeTelegram: 0,
  incomeOnlyfans: 0,
  incomeTransfers: 0,
  incomeOther: 0,
  availabilityStatus: 'full',
  availabilityGapsDetail: '',
  hasDebts: false,
  debtsDetail: '',
  hasPendingSales: false,
  pendingSalesDetail: '',
  hasUnusualEvents: false,
  unusualEventsDetail: '',
  allDepositsVerified: false,
  improvementSuggestions: '',
  contentRequest: '',
  selfImprovementPoint: '',
  selfPreservationPoint: '',
};

export default function DailySummaries() {
  const [summaries, setSummaries] = useState([]);
  const [debts, setDebts] = useState([]);
  const [chatters, setChatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  // Create/Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const params = {};
      if (filterActive && startDate) params.startDate = startDate;
      if (filterActive && endDate) params.endDate = endDate;

      const [summariesData, debtsData, chattersData] = await Promise.all([
        getDailySummaries(params),
        getSummaryDebts(),
        getChatters(),
      ]);
      setSummaries(Array.isArray(summariesData) ? summariesData : []);
      setDebts(Array.isArray(debtsData) ? debtsData : []);
      setChatters(Array.isArray(chattersData) ? chattersData : []);
    } catch (err) {
      setError(err.message);
    }
  }, [filterActive, startDate, endDate]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleFilter = () => {
    setFilterActive(true);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilterActive(false);
  };

  // Calculate totals from actual DB fields
  const totalTelegram = summaries.reduce((sum, s) => sum + (s.incomeTelegram || 0), 0);
  const totalOnlyfans = summaries.reduce((sum, s) => sum + (s.incomeOnlyfans || 0), 0);
  const totalTransfers = summaries.reduce((sum, s) => sum + (s.incomeTransfers || 0), 0);
  const totalOther = summaries.reduce((sum, s) => sum + (s.incomeOther || 0), 0);
  const totalIncome = totalTelegram + totalOnlyfans + totalTransfers + totalOther;
  const uniqueChatters = new Set(summaries.map((s) => s.chatterId?._id || s.chatterId)).size;

  // Form handlers
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (summary) => {
    setEditingId(summary._id);
    setForm({
      chatterId: summary.chatterId?._id || summary.chatterId || '',
      date: toInputDate(summary.date),
      shiftType: summary.shiftType || 'בוקר',
      incomeTelegram: summary.incomeTelegram || 0,
      incomeOnlyfans: summary.incomeOnlyfans || 0,
      incomeTransfers: summary.incomeTransfers || 0,
      incomeOther: summary.incomeOther || 0,
      availabilityStatus: summary.availabilityStatus || 'full',
      availabilityGapsDetail: summary.availabilityGapsDetail || '',
      hasDebts: summary.hasDebts || false,
      debtsDetail: summary.debtsDetail || '',
      hasPendingSales: summary.hasPendingSales || false,
      pendingSalesDetail: summary.pendingSalesDetail || '',
      hasUnusualEvents: summary.hasUnusualEvents || false,
      unusualEventsDetail: summary.unusualEventsDetail || '',
      allDepositsVerified: summary.allDepositsVerified || false,
      improvementSuggestions: summary.improvementSuggestions || '',
      contentRequest: summary.contentRequest || '',
      selfImprovementPoint: summary.selfImprovementPoint || '',
      selfPreservationPoint: summary.selfPreservationPoint || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        incomeTotal: Number(form.incomeTelegram) + Number(form.incomeOnlyfans) + Number(form.incomeTransfers) + Number(form.incomeOther),
        incomeTelegram: Number(form.incomeTelegram),
        incomeOnlyfans: Number(form.incomeOnlyfans),
        incomeTransfers: Number(form.incomeTransfers),
        incomeOther: Number(form.incomeOther),
      };

      if (!payload.shiftId) {
        payload.shiftId = payload.chatterId;
      }

      if (editingId) {
        await updateDailySummary(editingId, payload);
      } else {
        await createDailySummary(payload);
      }
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const computedTotal = Number(form.incomeTelegram) + Number(form.incomeOnlyfans) + Number(form.incomeTransfers) + Number(form.incomeOther);

  // Export to CSV
  const exportCSV = () => {
    const headers = ['תאריך', 'צ׳אטר', 'סוג משמרת', 'טלגרם', 'אונליפאנס', 'העברות', 'אחר', 'סה"כ', 'זמינות'];
    const rows = summaries.map((s) => [
      formatDate(s.date),
      s.chatterId?.name || 'לא ידוע',
      s.shiftType || '',
      s.incomeTelegram || 0,
      s.incomeOnlyfans || 0,
      s.incomeTransfers || 0,
      s.incomeOther || 0,
      s.incomeTotal || 0,
      s.availabilityStatus || '',
    ]);

    rows.push(['', '', '', totalTelegram, totalOnlyfans, totalTransfers, totalOther, totalIncome, '']);

    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-summaries-${startDate || 'all'}-${endDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 pb-24 p-4 lg:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">סיכומי יום</h1>
          <p className="text-gray-400 text-sm mt-1">סיכומי הכנסות לפי צ׳אטרים ותאריכים</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            סיכום חדש
          </button>
          <button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            ייצוא CSV
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-gray-900 rounded-xl p-4 flex flex-wrap items-end gap-3 min-w-0">
        <Filter className="w-5 h-5 text-gray-400 shrink-0" />
        <div className="min-w-0">
          <label className="text-xs text-gray-400 block mb-1">מתאריך</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full max-w-[160px] bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="min-w-0">
          <label className="text-xs text-gray-400 block mb-1">עד תאריך</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full max-w-[160px] bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors shrink-0">סנן</button>
        {filterActive && (
          <button onClick={clearFilter} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors shrink-0">
            <X className="w-3 h-3" />
            נקה
          </button>
        )}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>}

      {/* Debts Section */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-lg font-bold text-white">חובות סיכום יום</h2>
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{debts.length}</span>
        </div>
        <p className="text-sm text-gray-400 mb-4">משמרות שחייבים סיכום ועדיין לא הוגש:</p>
        {debts.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-gray-400">אין חובות סיכום</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {debts.slice(0, 12).map((debt, i) => (
              <div key={debt._id || i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-white truncate">{debt.chatterId?.name || 'לא ידוע'}</p>
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <p className="text-sm text-gray-400">{formatDate(debt.date)}</p>
                <p className="text-sm text-gray-500">{formatTime(debt.startTime)} - {formatTime(debt.endTime)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summaries Table */}
      {summaries.length > 0 && (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">סיכומים ({summaries.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400">
                  <th className="py-3 px-4 font-medium whitespace-nowrap">תאריך</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">צ׳אטר</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">משמרת</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">טלגרם <span className="text-xs text-gray-600">(€→$)</span></th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">אונלי <span className="text-xs text-gray-600">($)</span></th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">העברות <span className="text-xs text-gray-600">(₪→$)</span></th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">אחר <span className="text-xs text-gray-600">(₪→$)</span></th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סה"כ $</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {summaries.map((s) => {
                  const hasUSD = s.incomeTotalUSD != null && s.incomeTotalUSD > 0;
                  return (
                    <tr key={s._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-2.5 px-4 text-gray-300 whitespace-nowrap">{formatDate(s.date)}</td>
                      <td className="py-2.5 px-4 text-white font-medium whitespace-nowrap">{s.chatterId?.name || 'לא ידוע'}</td>
                      <td className="py-2.5 px-4 text-gray-400 whitespace-nowrap">{s.shiftType || '—'}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-gray-300">${(s.incomeTelegramUSD || 0).toFixed(2)}</span>
                        <span className="text-gray-600 text-xs mr-1">(€{s.incomeTelegram || 0})</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-gray-300">${(s.incomeOnlyfansUSD ?? s.incomeOnlyfans ?? 0).toFixed(2)}</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-gray-300">${(s.incomeTransfersUSD || 0).toFixed(2)}</span>
                        <span className="text-gray-600 text-xs mr-1">(₪{s.incomeTransfers || 0})</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-gray-300">${(s.incomeOtherUSD || 0).toFixed(2)}</span>
                        <span className="text-gray-600 text-xs mr-1">(₪{s.incomeOther || 0})</span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-green-400 font-bold">${(hasUSD ? s.incomeTotalUSD : s.incomeTotal || 0).toFixed(2)}</span>
                        {!hasUSD && <span className="text-gray-600 text-xs mr-1">(ללא המרה)</span>}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-blue-400 transition-colors" title="ערוך">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800/50 font-bold text-white">
                  <td className="py-3 px-4" colSpan={3}>סה"כ</td>
                  <td className="py-3 px-4">${summaries.reduce((s, r) => s + (r.incomeTelegramUSD || 0), 0).toFixed(2)}</td>
                  <td className="py-3 px-4">${summaries.reduce((s, r) => s + (r.incomeOnlyfansUSD ?? r.incomeOnlyfans ?? 0), 0).toFixed(2)}</td>
                  <td className="py-3 px-4">${summaries.reduce((s, r) => s + (r.incomeTransfersUSD || 0), 0).toFixed(2)}</td>
                  <td className="py-3 px-4">${summaries.reduce((s, r) => s + (r.incomeOtherUSD || 0), 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-green-400">${summaries.reduce((s, r) => s + (r.incomeTotalUSD || r.incomeTotal || 0), 0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 sm:px-6 py-3 lg:pr-64 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm" dir="rtl">
          <div className="text-gray-400 whitespace-nowrap">סיכומים <span className="text-white font-bold">{summaries.length}</span></div>
          <div className="text-gray-400 whitespace-nowrap">צ׳אטרים <span className="text-white font-bold">{uniqueChatters}</span></div>
          <div className="text-gray-400 whitespace-nowrap">טלגרם <span className="text-white font-bold">${summaries.reduce((s, r) => s + (r.incomeTelegramUSD || 0), 0).toFixed(2)}</span></div>
          <div className="text-gray-400 whitespace-nowrap">אונלי <span className="text-white font-bold">${summaries.reduce((s, r) => s + (r.incomeOnlyfansUSD ?? r.incomeOnlyfans ?? 0), 0).toFixed(2)}</span></div>
          <div className="text-gray-400 whitespace-nowrap">העברות <span className="text-white font-bold">${summaries.reduce((s, r) => s + (r.incomeTransfersUSD || 0), 0).toFixed(2)}</span></div>
          <div className="text-gray-400 whitespace-nowrap">סה"כ <span className="text-green-400 font-bold">${summaries.reduce((s, r) => s + (r.incomeTotalUSD || r.incomeTotal || 0), 0).toFixed(2)}</span></div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingId ? 'ערוך סיכום יום' : 'סיכום יום חדש'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">צ׳אטר</label>
                  <select value={form.chatterId} onChange={(e) => setForm({ ...form, chatterId: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">בחר צ׳אטר</option>
                    {chatters.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">תאריך</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">סוג משמרת</label>
                  <select value={form.shiftType} onChange={(e) => setForm({ ...form, shiftType: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="בוקר">בוקר</option>
                    <option value="ערב">ערב</option>
                    <option value="כפולה">כפולה</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">זמינות</label>
                  <select value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="full">מלאה</option>
                    <option value="partial">חלקית</option>
                    <option value="absent">נעדר</option>
                  </select>
                </div>
              </div>

              {/* Income fields */}
              <div>
                <h3 className="text-white font-medium text-sm mb-2">הכנסות</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">טלגרם $</label>
                    <input type="number" min="0" value={form.incomeTelegram} onChange={(e) => setForm({ ...form, incomeTelegram: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">אונליפאנס $</label>
                    <input type="number" min="0" value={form.incomeOnlyfans} onChange={(e) => setForm({ ...form, incomeOnlyfans: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">העברות $</label>
                    <input type="number" min="0" value={form.incomeTransfers} onChange={(e) => setForm({ ...form, incomeTransfers: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">אחר $</label>
                    <input type="number" min="0" value={form.incomeOther} onChange={(e) => setForm({ ...form, incomeOther: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="mt-2 bg-gray-800 rounded-lg px-4 py-2 text-sm">
                  <span className="text-gray-400">סה"כ הכנסה: </span>
                  <span className="text-green-400 font-bold">${computedTotal.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs mr-2">(טלגרם + אונלי + העברות + אחר)</span>
                </div>
              </div>

              {/* Additional details */}
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">פרטים נוספים</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={form.hasDebts} onChange={(e) => setForm({ ...form, hasDebts: e.target.checked })} className="rounded bg-gray-800 border-gray-700" />
                    יש חובות
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={form.hasPendingSales} onChange={(e) => setForm({ ...form, hasPendingSales: e.target.checked })} className="rounded bg-gray-800 border-gray-700" />
                    יש מכירות תלויות
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={form.hasUnusualEvents} onChange={(e) => setForm({ ...form, hasUnusualEvents: e.target.checked })} className="rounded bg-gray-800 border-gray-700" />
                    אירועים חריגים
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={form.allDepositsVerified} onChange={(e) => setForm({ ...form, allDepositsVerified: e.target.checked })} className="rounded bg-gray-800 border-gray-700" />
                    כל ההפקדות אומתו
                  </label>
                </div>
                {form.hasDebts && (
                  <textarea value={form.debtsDetail} onChange={(e) => setForm({ ...form, debtsDetail: e.target.value })} placeholder="פירוט חובות" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
                )}
                {form.hasUnusualEvents && (
                  <textarea value={form.unusualEventsDetail} onChange={(e) => setForm({ ...form, unusualEventsDetail: e.target.value })} placeholder="פירוט אירועים חריגים" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
                )}
                <textarea value={form.improvementSuggestions} onChange={(e) => setForm({ ...form, improvementSuggestions: e.target.value })} placeholder="הצעות לשיפור (אופציונלי)" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  {saving ? 'שומר...' : editingId ? 'עדכן סיכום' : 'צור סיכום'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm transition-colors">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
