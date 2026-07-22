import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  FileText,
  Plus,
  Pencil,
  Download,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import {
  getDailySummaries,
  getSummaryDebts,
  createDailySummary,
  updateDailySummary,
  getChatters,
  getMonthlyGoals,
} from "../../services/api.js";

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

function formatTime(t) {
  if (!t) return "";
  return t.slice(0, 5);
}

function toInputDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

const EMPTY_FORM = {
  chatterId: "",
  date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }),
  shiftType: "בוקר",
  incomeTelegram: 0,
  incomeOnlyfans: 0,
  incomeTransfers: 0,
  incomeOther: 0,
  availabilityStatus: "full",
  availabilityGapsDetail: "",
  hasDebts: false,
  debtsDetail: "",
  hasPendingSales: false,
  pendingSalesDetail: "",
  hasUnusualEvents: false,
  unusualEventsDetail: "",
  allDepositsVerified: false,
  improvementSuggestions: "",
  contentRequest: "",
  selfImprovementPoint: "",
  selfPreservationPoint: "",
};

export default function DailySummaries() {
  const [summaries, setSummaries] = useState([]);
  const [debts, setDebts] = useState([]);
  const [chatters, setChatters] = useState([]);
  const [monthlyGoals, setMonthlyGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Selected chatter view
  const [selectedChatterId, setSelectedChatterId] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [filterChatter, setFilterChatter] = useState("");

  // View modal
  const [viewingSummary, setViewingSummary] = useState(null);

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

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const [summariesData, debtsData, chattersData, goalsData] = await Promise.all([
        getDailySummaries(params),
        getSummaryDebts(),
        getChatters(),
        getMonthlyGoals(currentMonth),
      ]);
      setSummaries(Array.isArray(summariesData) ? summariesData : []);
      setDebts(Array.isArray(debtsData) ? debtsData : []);
      setChatters(Array.isArray(chattersData) ? chattersData : []);
      setMonthlyGoals(Array.isArray(goalsData) ? goalsData : []);
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
    if (startDate && endDate && startDate > endDate) {
      setStartDate(endDate);
      setEndDate(startDate);
    }
    setFilterActive(true);
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilterActive(false);
  };

  // Form handlers
  const openCreate = (chatterId = "") => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, chatterId });
    setShowForm(true);
  };

  const openEdit = (summary) => {
    setEditingId(summary._id);
    setForm({
      chatterId: summary.chatterId?._id || summary.chatterId || "",
      date: toInputDate(summary.date),
      shiftType: summary.shiftType || "בוקר",
      incomeTelegram: summary.incomeTelegram || 0,
      incomeOnlyfans: summary.incomeOnlyfans || 0,
      incomeTransfers: summary.incomeTransfers || 0,
      incomeOther: summary.incomeOther || 0,
      availabilityStatus: summary.availabilityStatus || "full",
      availabilityGapsDetail: summary.availabilityGapsDetail || "",
      hasDebts: summary.hasDebts || false,
      debtsDetail: summary.debtsDetail || "",
      hasPendingSales: summary.hasPendingSales || false,
      pendingSalesDetail: summary.pendingSalesDetail || "",
      hasUnusualEvents: summary.hasUnusualEvents || false,
      unusualEventsDetail: summary.unusualEventsDetail || "",
      allDepositsVerified: summary.allDepositsVerified || false,
      improvementSuggestions: summary.improvementSuggestions || "",
      contentRequest: summary.contentRequest || "",
      selfImprovementPoint: summary.selfImprovementPoint || "",
      selfPreservationPoint: summary.selfPreservationPoint || "",
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
        incomeTotal:
          Number(form.incomeTelegram) +
          Number(form.incomeOnlyfans) +
          Number(form.incomeTransfers) +
          Number(form.incomeOther),
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

  const computedTotal =
    Number(form.incomeTelegram) +
    Number(form.incomeOnlyfans) +
    Number(form.incomeTransfers) +
    Number(form.incomeOther);

  // Export to CSV
  const exportCSV = () => {
    const headers = [
      "תאריך",
      "צ׳אטר",
      "סוג משמרת",
      "טלגרם ($)",
      "אונליפאנס ($)",
      "העברות ($)",
      "אחר ($)",
      'סה"כ ($)',
      "זמינות",
    ];
    const rows = summaries.map((s) => [
      formatDate(s.date),
      s.chatterId?.name || "לא ידוע",
      s.shiftType || "",
      Math.round(s.incomeTelegramUSD || 0),
      Math.round(s.incomeOnlyfansUSD ?? s.incomeOnlyfans ?? 0),
      Math.round(s.incomeTransfersUSD || 0),
      Math.round(s.incomeOtherUSD || 0),
      Math.round(s.incomeTotalUSD || s.incomeTotal || 0),
      s.availabilityStatus || "",
    ]);

    const totalTelegramUSD = summaries.reduce(
      (s, r) => s + (r.incomeTelegramUSD || 0),
      0,
    );
    const totalOnlyfansUSD = summaries.reduce(
      (s, r) => s + (r.incomeOnlyfansUSD ?? r.incomeOnlyfans ?? 0),
      0,
    );
    const totalTransfersUSD = summaries.reduce(
      (s, r) => s + (r.incomeTransfersUSD || 0),
      0,
    );
    const totalOtherUSD = summaries.reduce(
      (s, r) => s + (r.incomeOtherUSD || 0),
      0,
    );
    const totalIncomeUSD = summaries.reduce(
      (s, r) => s + (r.incomeTotalUSD || r.incomeTotal || 0),
      0,
    );

    rows.push([
      "",
      "",
      "",
      Math.round(totalTelegramUSD),
      Math.round(totalOnlyfansUSD),
      Math.round(totalTransfersUSD),
      Math.round(totalOtherUSD),
      Math.round(totalIncomeUSD),
      "",
    ]);

    const BOM = "\uFEFF";
    const csv =
      BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-summaries-${startDate || "all"}-${endDate || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build per-chatter stats for the grid view
  const now2 = new Date();
  const currentMonth = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-01`;
  const chatterStats = chatters.map((chatter) => {
    const chatterSummaries = summaries.filter(
      (s) => (s.chatterId?._id || s.chatterId) === chatter._id,
    );
    const chatterDebts = debts.filter(
      (d) => (d.chatterId?._id || d.chatterId) === chatter._id,
    );
    const totalUSD = chatterSummaries.reduce(
      (sum, s) => sum + (s.incomeTotalUSD || s.incomeTotal || 0),
      0,
    );
    // Current month income only
    const monthlySummaries = chatterSummaries.filter(
      (s) => s.date && s.date.slice(0, 7) === currentMonth.slice(0, 7)
    );
    const monthlyUSD = monthlySummaries.reduce((sum, s) => sum + (s.incomeTotalUSD || s.incomeTotal || 0), 0);
    const monthlyTelegram = monthlySummaries.reduce((sum, s) => sum + (s.incomeTelegramUSD || 0), 0);
    const monthlyOnlyfans = monthlySummaries.reduce((sum, s) => sum + (s.incomeOnlyfansUSD ?? s.incomeOnlyfans ?? 0), 0);
    const monthlyTransfers = monthlySummaries.reduce((sum, s) => sum + (s.incomeTransfersUSD || 0), 0);
    const monthlyOther = monthlySummaries.reduce((sum, s) => sum + (s.incomeOtherUSD || 0), 0);
    const goalEntry = monthlyGoals.find(
      (g) => (g.chatterId?._id || g.chatterId) === chatter._id,
    );
    const goalAmount = goalEntry?.goalAmount || 0;
    const lastSummary = [...chatterSummaries].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    )[0];
    return {
      chatter,
      summaries: chatterSummaries,
      debts: chatterDebts,
      totalUSD,
      monthlyUSD,
      monthlyTelegram,
      monthlyOnlyfans,
      monthlyTransfers,
      monthlyOther,
      goalAmount,
      lastSummary,
    };
  });

  // Selected chatter data
  const selectedChatterData = selectedChatterId
    ? chatterStats.find((cs) => cs.chatter._id === selectedChatterId)
    : null;

  const chatterSummaries = selectedChatterData
    ? selectedChatterData.summaries
        .filter((s) => {
          if (!filterActive) return true;
          const d = new Date(s.date);
          if (startDate && d < new Date(startDate)) return false;
          if (endDate && d > new Date(endDate)) return false;
          return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 pb-24 p-4 lg:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {selectedChatterData
                ? selectedChatterData.chatter.name
                : "סיכומי יום"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {selectedChatterData
                ? `${chatterSummaries.length} סיכומים · ${selectedChatterData.debts.length} חובות`
                : "סיכומי הכנסות לפי צ׳אטרים ותאריכים"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openCreate(selectedChatterId || "")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            סיכום חדש
          </button>
          {!selectedChatterId && (
            <button
              onClick={exportCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              ייצוא CSV
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ===== MAIN VIEW: Chatter Grid ===== */}
      {!selectedChatterId && (
        <>

          {/* Chatter Grid */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">צ׳אטרים</h2>
            {chatterStats.length === 0 ? (
              <div className="text-center py-16 text-gray-500">אין צ׳אטרים</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {chatterStats.map(({ chatter, summaries: cs, debts: cd, totalUSD, monthlyUSD, monthlyTelegram, monthlyOnlyfans, monthlyTransfers, monthlyOther, goalAmount, lastSummary }) => {
                  const progress = goalAmount > 0 ? Math.min((monthlyUSD / goalAmount) * 100, 100) : 0;
                  const progressColor = progress >= 100 ? "bg-green-500" : progress >= 60 ? "bg-blue-500" : progress >= 30 ? "bg-yellow-500" : "bg-red-500";
                  const progressTextColor = progress >= 100 ? "text-green-500" : progress >= 60 ? "text-blue-500" : progress >= 30 ? "text-yellow-500" : "text-red-500";
                  return (
                    <button
                      key={chatter._id}
                      onClick={() => setSelectedChatterId(chatter._id)}
                      className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/60 rounded-xl p-5 text-right transition-all group"
                    >
                      {/* Name */}
                      <div className="mb-1">
                        <p className="text-xl font-bold text-white truncate group-hover:text-blue-300 transition-colors text-center">
                          {chatter.name}
                        </p>
                      </div>

                      {/* Month + amount on same row as bar */}
                      <p className="text-sm text-gray-400 mb-10 text-center">
                        {new Date().toLocaleString('he-IL', { month: 'long', year: 'numeric' })}
                      </p>

                      {/* Platform breakdown */}
                      <div className="grid grid-cols-2 gap-1.5 -mt-2 mb-5">
                        <div className="bg-blue-500/15 border border-blue-500/25 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-xs text-blue-300 font-medium">${Math.round(monthlyTelegram)}</p>
                          <p className="text-xs text-gray-500">טלגרם</p>
                        </div>
                        <div className="bg-cyan-500/15 border border-cyan-500/25 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-xs text-cyan-300 font-medium">${Math.round(monthlyOnlyfans)}</p>
                          <p className="text-xs text-gray-500">אונלי</p>
                        </div>
                        <div className="bg-purple-500/15 border border-purple-500/25 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-xs text-purple-300 font-medium">${Math.round(monthlyTransfers)}</p>
                          <p className="text-xs text-gray-500">העברות</p>
                        </div>
                        <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-xs text-gray-300 font-medium">${Math.round(monthlyOther)}</p>
                          <p className="text-xs text-gray-500">אחר</p>
                        </div>
                      </div>

                      {/* Progress bar + amount */}
                      <div className="mb-2">
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                          {goalAmount > 0 && (
                            <span className="text-xs text-gray-500">${Math.round(goalAmount)} /</span>
                          )}
                          <span className={`text-base font-bold ${goalAmount > 0 ? progressTextColor : 'text-white'}`}>${Math.round(monthlyUSD)}</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          {goalAmount > 0 && (
                            <div
                              className={`h-full rounded-full transition-all ${progressColor}`}
                              style={{ width: `${progress}%` }}
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 h-4 text-center">
                          {goalAmount > 0 ? `${Math.round(progress)}%` : ''}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-white border-t border-gray-800 pt-2">
                        <span>{cs.length} סיכומים</span>
                        {cd.length > 0
                          ? <span className="text-red-400 font-medium">{cd.length} חובות</span>
                          : <span>0 חובות</span>
                        }
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summaries Table - DISABLED
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">
                סיכומים ({summaries.length})
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterChatter}
                  onChange={(e) => setFilterChatter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">כל הצ׳אטרים</option>
                  {chatters.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleFilter}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                >
                  <Filter className="w-3.5 h-3.5" />
                  סנן
                </button>
                {(filterActive || filterChatter) && (
                  <button
                    onClick={() => { clearFilter(); setFilterChatter(""); }}
                    className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                    נקה
                  </button>
                )}
              </div>
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
                  {summaries.filter(s => !filterChatter || (s.chatterId?._id || s.chatterId) === filterChatter).length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-500 text-sm">אין סיכומים להצגה</td>
                    </tr>
                  )}
                  {summaries.filter(s => !filterChatter || (s.chatterId?._id || s.chatterId) === filterChatter).map((s) => {
                    const hasUSD = s.incomeTotalUSD != null && s.incomeTotalUSD > 0;
                    return (
                      <tr key={s._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-gray-300 whitespace-nowrap">{formatDate(s.date)}</td>
                        <td className="py-2.5 px-4 text-white font-medium whitespace-nowrap">{s.chatterId?.name || "לא ידוע"}</td>
                        <td className="py-2.5 px-4 text-gray-400 whitespace-nowrap">{s.shiftType || "—"}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="text-gray-300">${(s.incomeTelegramUSD || 0).toFixed(2)}</span>
                          <span className="text-gray-600 text-xs mr-1">(€{s.incomeTelegram || 0})</span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="text-gray-300">${(s.incomeOnlyfansUSD ?? s.incomeOnlyfans ?? 0).toFixed(2)}</span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="text-gray-300">${(s.incomeTransfersUSD || 0).toFixed(2)}</span>
                          <span className="text-gray-600 text-xs mr-1">(₪{Math.round((s.incomeTransfers || 0) / 1.18)})</span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="text-gray-300">${(s.incomeOtherUSD || 0).toFixed(2)}</span>
                          <span className="text-gray-600 text-xs mr-1">(₪{Math.round((s.incomeOther || 0) / 1.18)})</span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="text-green-400 font-bold">
                            ${(hasUSD ? s.incomeTotalUSD : s.incomeTotal || 0).toFixed(2)}
                          </span>
                          {!hasUSD && <span className="text-gray-600 text-xs mr-1">(ללא המרה)</span>}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => setViewingSummary(s)}
                            className="text-gray-400 hover:text-blue-400 transition-colors text-xs flex items-center gap-1 whitespace-nowrap"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            דו"ח מלא
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-800/50 font-bold text-white">
                    <td className="py-3 px-4" colSpan={3}>סה"כ</td>
                    <td className="py-3 px-4">
                      ${summaries.filter(s => !filterChatter || (s.chatterId?._id || s.chatterId) === filterChatter).reduce((s, r) => s + (r.incomeTelegramUSD || 0), 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      ${summaries.filter(s => !filterChatter || (s.chatterId?._id || s.chatterId) === filterChatter).reduce((s, r) => s + (r.incomeOnlyfansUSD ?? r.incomeOnlyfans ?? 0), 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      ${summaries.filter(s => !filterChatter || (s.chatterId?._id || s.chatterId) === filterChatter).reduce((s, r) => s + (r.incomeTransfersUSD || 0), 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      ${summaries.filter(s => !filterChatter || (s.chatterId?._id || s.chatterId) === filterChatter).reduce((s, r) => s + (r.incomeOtherUSD || 0), 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-green-400">
                      ${summaries.filter(s => !filterChatter || (s.chatterId?._id || s.chatterId) === filterChatter).reduce((s, r) => s + (r.incomeTotalUSD || r.incomeTotal || 0), 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          DISABLED */}
        </>
      )}

      {/* ===== CHATTER DETAIL VIEW ===== */}
      {selectedChatterId && selectedChatterData && (
        <>
          {/* Chatter debts */}
          {selectedChatterData.debts.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold text-white">חובות</h2>
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedChatterData.debts.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedChatterData.debts.map((debt, i) => (
                  <div
                    key={debt._id || i}
                    className="bg-gray-800 border border-red-900/40 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-300">{formatDate(debt.date)}</p>
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(debt.startTime)} - {formatTime(debt.endTime)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters + Back */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => {
                setSelectedChatterId(null);
                clearFilter();
              }}
              className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              חזרה
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleFilter}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                סנן
              </button>
              {filterActive && (
                <button
                  onClick={clearFilter}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  נקה
                </button>
              )}
            </div>
          </div>

          {/* Shifts list */}
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold text-white">
                משמרות ({chatterSummaries.length})
              </h2>
            </div>
            {chatterSummaries.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                אין סיכומים להצגה
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {chatterSummaries.map((s) => {
                  const hasUSD = s.incomeTotalUSD != null && s.incomeTotalUSD > 0;
                  const total = hasUSD ? s.incomeTotalUSD : s.incomeTotal || 0;
                  return (
                    <div
                      key={s._id}
                      onClick={() => setViewingSummary(s)}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Date + shift type */}
                        <div className="shrink-0">
                          <p className="text-white font-medium text-sm">
                            {formatDate(s.date)}
                          </p>
                          <p className="text-xs text-gray-500">{s.shiftType || "—"}</p>
                        </div>

                        {/* Income breakdown */}
                        <div className="hidden sm:flex items-center flex-wrap gap-1.5">
                          {s.incomeTelegram > 0 && (
                            <span className="bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                              טלג׳ €{s.incomeTelegram}
                            </span>
                          )}
                          {s.incomeOnlyfans > 0 && (
                            <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                              OF ${s.incomeOnlyfans}
                            </span>
                          )}
                          {s.incomeTransfers > 0 && (
                            <span className="bg-purple-500/15 text-purple-300 border border-purple-500/25 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                              העב׳ ₪{Math.round(s.incomeTransfers / 1.18)}
                            </span>
                          )}
                          {s.incomeOther > 0 && (
                            <span className="bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                              אחר ₪{Math.round(s.incomeOther / 1.18)}
                            </span>
                          )}
                        </div>

                        {/* Flags */}
                        <div className="flex items-center gap-1.5">
                          {s.hasDebts && (
                            <span className="w-2 h-2 rounded-full bg-red-500" title="חובות" />
                          )}
                          {s.hasPendingSales && (
                            <span className="w-2 h-2 rounded-full bg-yellow-500" title="מכירות תלויות" />
                          )}
                          {s.hasUnusualEvents && (
                            <span className="w-2 h-2 rounded-full bg-orange-500" title="אירועים חריגים" />
                          )}
                          {s.allDepositsVerified && (
                            <span className="w-2 h-2 rounded-full bg-green-500" title="הפקדות אומתו" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-green-400 font-bold text-sm">
                          ${total.toFixed(2)}
                        </span>
                        <button
                          onClick={() => setViewingSummary(s)}
                          className="text-gray-400 hover:text-blue-400 transition-colors text-xs flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">דו"ח</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Chatter total footer */}
            {chatterSummaries.length > 0 && (
              <div className="px-5 py-3 bg-gray-800/50 border-t border-gray-800 flex justify-between items-center">
                <span className="text-sm text-gray-400">סה"כ</span>
                <span className="text-green-400 font-bold">
                  ${chatterSummaries
                    .reduce((sum, s) => sum + (s.incomeTotalUSD || s.incomeTotal || 0), 0)
                    .toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Stats Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 sm:px-6 py-3 lg:pr-64 z-30">
        <div
          className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm"
          dir="rtl"
        >
          {selectedChatterData ? (
            <>
              <div className="text-gray-400 whitespace-nowrap">
                {selectedChatterData.chatter.name}
              </div>
              <div className="text-gray-400 whitespace-nowrap">
                משמרות{" "}
                <span className="text-white font-bold">{chatterSummaries.length}</span>
              </div>
              <div className="text-gray-400 whitespace-nowrap">
                סה"כ{" "}
                <span className="text-green-400 font-bold">
                  ${chatterSummaries
                    .reduce((s, r) => s + (r.incomeTotalUSD || r.incomeTotal || 0), 0)
                    .toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-gray-400 whitespace-nowrap">
                סיכומים{" "}
                <span className="text-white font-bold">{summaries.length}</span>
              </div>
              <div className="text-gray-400 whitespace-nowrap">
                צ׳אטרים{" "}
                <span className="text-white font-bold">
                  {new Set(summaries.map((s) => s.chatterId?._id || s.chatterId)).size}
                </span>
              </div>
              <div className="text-gray-400 whitespace-nowrap">
                חובות{" "}
                <span className={`font-bold ${debts.length > 0 ? "text-red-400" : "text-white"}`}>
                  {debts.length}
                </span>
              </div>
              <div className="text-gray-400 whitespace-nowrap">
                סה"כ{" "}
                <span className="text-green-400 font-bold">
                  $
                  {summaries
                    .reduce(
                      (s, r) => s + (r.incomeTotalUSD || r.incomeTotal || 0),
                      0,
                    )
                    .toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* View Summary Modal */}
      {viewingSummary && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setViewingSummary(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {viewingSummary.chatterId?.name || "לא ידוע"}
                </h2>
                <p className="text-sm text-gray-400">
                  {formatDate(viewingSummary.date)} · {viewingSummary.shiftType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewingSummary(null);
                    openEdit(viewingSummary);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  ערוך
                </button>
                <button
                  onClick={() => setViewingSummary(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* הכנסות */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  הכנסות
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">טלגרם</p>
                    <p className="text-white font-bold">
                      ${(viewingSummary.incomeTelegramUSD || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      €{viewingSummary.incomeTelegram || 0}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">אונליפאנס</p>
                    <p className="text-white font-bold">
                      $
                      {(
                        viewingSummary.incomeOnlyfansUSD ??
                        viewingSummary.incomeOnlyfans ??
                        0
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">העברות</p>
                    <p className="text-white font-bold">
                      ${(viewingSummary.incomeTransfersUSD || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      ₪{Math.round((viewingSummary.incomeTransfers || 0) / 1.18)}{" "}
                      <span className="text-gray-700">(₪{viewingSummary.incomeTransfers || 0})</span>
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">אחר</p>
                    <p className="text-white font-bold">
                      ${(viewingSummary.incomeOtherUSD || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      ₪{Math.round((viewingSummary.incomeOther || 0) / 1.18)}{" "}
                      <span className="text-gray-700">(₪{viewingSummary.incomeOther || 0})</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2 bg-gray-800/50 rounded-lg px-4 py-2 flex justify-between">
                  <span className="text-sm text-gray-400">סה"כ</span>
                  <span className="text-green-400 font-bold">
                    $
                    {(
                      viewingSummary.incomeTotalUSD ||
                      viewingSummary.incomeTotal ||
                      0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* זמינות */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  זמינות
                </h3>
                <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
                  {viewingSummary.availabilityStatus === "full" && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {viewingSummary.availabilityStatus === "partial" && (
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  )}
                  {viewingSummary.availabilityStatus === "absent" && (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-white text-sm">
                    {viewingSummary.availabilityStatus === "full"
                      ? "מלאה"
                      : viewingSummary.availabilityStatus === "partial"
                        ? "חלקית"
                        : "נעדר"}
                  </span>
                  {viewingSummary.availabilityGapsDetail && (
                    <span className="text-gray-400 text-sm">
                      — {viewingSummary.availabilityGapsDetail}
                    </span>
                  )}
                </div>
              </div>

              {/* דגלים */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  סטטוסים
                </h3>
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 ${viewingSummary.hasDebts ? "bg-red-900/20 border border-red-800/40" : "bg-gray-800"}`}
                  >
                    {viewingSummary.hasDebts ? (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm text-white">חובות</p>
                      {viewingSummary.hasDebts && viewingSummary.debtsDetail && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {viewingSummary.debtsDetail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 ${viewingSummary.hasPendingSales ? "bg-yellow-900/20 border border-yellow-800/40" : "bg-gray-800"}`}
                  >
                    {viewingSummary.hasPendingSales ? (
                      <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm text-white">מכירות תלויות</p>
                      {viewingSummary.hasPendingSales && viewingSummary.pendingSalesDetail && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {viewingSummary.pendingSalesDetail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 ${viewingSummary.hasUnusualEvents ? "bg-orange-900/20 border border-orange-800/40" : "bg-gray-800"}`}
                  >
                    {viewingSummary.hasUnusualEvents ? (
                      <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm text-white">אירועים חריגים</p>
                      {viewingSummary.hasUnusualEvents && viewingSummary.unusualEventsDetail && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {viewingSummary.unusualEventsDetail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 ${viewingSummary.allDepositsVerified ? "bg-green-900/20 border border-green-800/40" : "bg-gray-800"}`}
                  >
                    {viewingSummary.allDepositsVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <p className="text-sm text-white">הפקדות אומתו</p>
                  </div>
                </div>
              </div>

              {/* הערות */}
              {(viewingSummary.improvementSuggestions ||
                viewingSummary.contentRequest ||
                viewingSummary.selfImprovementPoint ||
                viewingSummary.selfPreservationPoint) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    הערות
                  </h3>
                  <div className="space-y-2">
                    {viewingSummary.improvementSuggestions && (
                      <div className="bg-gray-800 rounded-lg px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">הצעות לשיפור</p>
                        <p className="text-sm text-gray-300">
                          {viewingSummary.improvementSuggestions}
                        </p>
                      </div>
                    )}
                    {viewingSummary.contentRequest && (
                      <div className="bg-gray-800 rounded-lg px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">בקשת תוכן</p>
                        <p className="text-sm text-gray-300">
                          {viewingSummary.contentRequest}
                        </p>
                      </div>
                    )}
                    {viewingSummary.selfImprovementPoint && (
                      <div className="bg-gray-800 rounded-lg px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">נקודת שיפור עצמי</p>
                        <p className="text-sm text-gray-300">
                          {viewingSummary.selfImprovementPoint}
                        </p>
                      </div>
                    )}
                    {viewingSummary.selfPreservationPoint && (
                      <div className="bg-gray-800 rounded-lg px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">נקודת שימור עצמי</p>
                        <p className="text-sm text-gray-300">
                          {viewingSummary.selfPreservationPoint}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "ערוך סיכום יום" : "סיכום יום חדש"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    צ׳אטר
                  </label>
                  <select
                    value={form.chatterId}
                    onChange={(e) =>
                      setForm({ ...form, chatterId: e.target.value })
                    }
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">בחר צ׳אטר</option>
                    {chatters.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    תאריך
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    סוג משמרת
                  </label>
                  <select
                    value={form.shiftType}
                    onChange={(e) =>
                      setForm({ ...form, shiftType: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="בוקר">בוקר</option>
                    <option value="ערב">ערב</option>
                    <option value="כפולה">כפולה</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    זמינות
                  </label>
                  <select
                    value={form.availabilityStatus}
                    onChange={(e) =>
                      setForm({ ...form, availabilityStatus: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
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
                    <label className="text-xs text-gray-400 block mb-1">
                      טלגרם <span className="text-yellow-500">€</span>
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 text-sm font-medium">
                        €
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={form.incomeTelegram}
                        onChange={(e) =>
                          setForm({ ...form, incomeTelegram: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.target.select()}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      אונליפאנס <span className="text-green-500">$</span>
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm font-medium">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={form.incomeOnlyfans}
                        onChange={(e) =>
                          setForm({ ...form, incomeOnlyfans: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.target.select()}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      העברות בנקאיות <span className="text-blue-400">₪</span>
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-medium">
                        ₪
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={form.incomeTransfers}
                        onChange={(e) =>
                          setForm({ ...form, incomeTransfers: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.target.select()}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      כולל מע&quot;מ 18%
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      אחר <span className="text-blue-400">₪</span>
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-medium">
                        ₪
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={form.incomeOther}
                        onChange={(e) =>
                          setForm({ ...form, incomeOther: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.target.select()}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      כולל מע&quot;מ 18%
                    </p>
                  </div>
                </div>
                <div className="mt-2 bg-gray-800 rounded-lg px-4 py-2 text-sm text-gray-500">
                  הסכום יומר לדולר אוטומטית בעת השמירה
                </div>
              </div>

              {/* Additional details */}
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">פרטים נוספים</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.hasDebts}
                      onChange={(e) =>
                        setForm({ ...form, hasDebts: e.target.checked })
                      }
                      className="rounded bg-gray-800 border-gray-700"
                    />
                    יש חובות
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.hasPendingSales}
                      onChange={(e) =>
                        setForm({ ...form, hasPendingSales: e.target.checked })
                      }
                      className="rounded bg-gray-800 border-gray-700"
                    />
                    יש מכירות תלויות
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.hasUnusualEvents}
                      onChange={(e) =>
                        setForm({ ...form, hasUnusualEvents: e.target.checked })
                      }
                      className="rounded bg-gray-800 border-gray-700"
                    />
                    אירועים חריגים
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.allDepositsVerified}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          allDepositsVerified: e.target.checked,
                        })
                      }
                      className="rounded bg-gray-800 border-gray-700"
                    />
                    כל ההפקדות אומתו
                  </label>
                </div>
                {form.hasDebts && (
                  <textarea
                    value={form.debtsDetail}
                    onChange={(e) =>
                      setForm({ ...form, debtsDetail: e.target.value })
                    }
                    placeholder="פירוט חובות"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    rows={2}
                  />
                )}
                {form.hasUnusualEvents && (
                  <textarea
                    value={form.unusualEventsDetail}
                    onChange={(e) =>
                      setForm({ ...form, unusualEventsDetail: e.target.value })
                    }
                    placeholder="פירוט אירועים חריגים"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    rows={2}
                  />
                )}
                <textarea
                  value={form.improvementSuggestions}
                  onChange={(e) =>
                    setForm({ ...form, improvementSuggestions: e.target.value })
                  }
                  placeholder="הצעות לשיפור (אופציונלי)"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? "שומר..." : editingId ? "עדכן סיכום" : "צור סיכום"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
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
