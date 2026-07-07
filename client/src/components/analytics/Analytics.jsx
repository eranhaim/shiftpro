import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Clock, Activity, Target } from 'lucide-react';
import { getAnalyticsOverview, getAnalyticsIncome, getAnalyticsShifts, getMonthlyGoals } from '../../services/api.js';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend,
} from 'recharts';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function toISODate(d) { return d.toISOString().split('T')[0]; }

function getDateRange(range) {
  const now = new Date();
  const end = toISODate(now);
  const start = new Date(now);
  switch (range) {
    case 'today': break;
    case 'week': start.setDate(start.getDate() - 7); break;
    case 'month': start.setMonth(start.getMonth() - 1); break;
    case '3months': start.setMonth(start.getMonth() - 3); break;
    default: start.setMonth(start.getMonth() - 1);
  }
  return { start: toISODate(start), end };
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

const TIME_RANGES = [
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'שבוע' },
  { key: 'month', label: 'חודש' },
  { key: '3months', label: '3 חודשים' },
  { key: 'custom', label: 'טווח מותאם' },
];

const TABS = [
  { key: 'overview', label: 'סקירה' },
  { key: 'chatters', label: 'צ׳אטרים' },
  { key: 'platforms', label: 'פלטפורמות' },
  { key: 'goals', label: 'יעדים' },
];

const PIE_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981'];
const STATUS_LABELS = { scheduled: 'מתוכנן', completed: 'הושלם', pending: 'ממתין', rejected: 'נדחה', approved: 'מאושר' };

const tooltipStyle = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '12px' };

export default function Analytics() {
  const [activeRange, setActiveRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [income, setIncome] = useState(null);
  const [shiftsData, setShiftsData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getRange = useCallback(() => {
    if (activeRange === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    return getDateRange(activeRange);
  }, [activeRange, customStart, customEnd]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { start, end } = getRange();
      const [overviewData, incomeData, shiftsRes, goalsData] = await Promise.allSettled([
        getAnalyticsOverview(start, end),
        getAnalyticsIncome(start, end),
        getAnalyticsShifts(start, end),
        getMonthlyGoals(getCurrentMonth()),
      ]);
      if (overviewData.status === 'fulfilled') setOverview(overviewData.value);
      if (incomeData.status === 'fulfilled') setIncome(incomeData.value);
      if (shiftsRes.status === 'fulfilled') setShiftsData(shiftsRes.value);
      if (goalsData.status === 'fulfilled') setGoals(goalsData.value || []);
    } catch (err) {
      setError(err.message);
    }
  }, [getRange]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  const kpis = [
    { label: 'הושלמו (נתוני עבר)', value: `${overview?.completionRate ?? 0}%`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'ממתינים לאישור', value: overview?.pendingApprovals ?? 0, icon: Clock, color: 'text-amber-400' },
    { label: 'משמרות היום', value: overview?.shiftsToday ?? 0, icon: Activity, color: 'text-blue-400' },
    { label: 'חובות סיכום יום', value: overview?.pendingSummaryDebts ?? 0, icon: Target, color: 'text-purple-400' },
  ];

  const chatterIncomes = Array.isArray(income?.incomeByChatter) ? income.incomeByChatter : [];
  const platformData = income?.incomeByPlatform || {};

  const shiftsByDay = (shiftsData?.shiftsByDay || []).map(d => ({
    ...d,
    date: d.date.slice(5),
  }));

  const statusBreakdown = shiftsData?.statusBreakdown || {};
  const pieData = Object.entries(statusBreakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v }));

  const platformEntries = Object.entries(platformData).filter(([, v]) => v > 0);
  const platformTotal = platformEntries.reduce((s, [, v]) => s + v, 0) || 1;

  const goalIncomeMap = {};
  chatterIncomes.forEach(c => { goalIncomeMap[c.chatterId] = c.totalIncome; });
  const goalProgress = goals.map(g => ({
    name: g.chatterId?.name || '—',
    goalAmount: g.goalAmount || 0,
    current: goalIncomeMap[g.chatterId?._id] || 0,
  })).filter(g => g.goalAmount > 0);

  return (
    <div className="space-y-6 p-4 lg:p-6 min-w-0" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">אנליטיקס</h1>
          <span className="bg-green-900 text-green-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            חי
          </span>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          רענן
        </button>
      </div>

      {/* Time range buttons */}
      <div className="flex flex-wrap gap-2 items-end">
        {TIME_RANGES.map(r => (
          <button key={r.key} onClick={() => setActiveRange(r.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${activeRange === r.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            {r.label}
          </button>
        ))}
        {activeRange === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            <span className="text-gray-400">—</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 min-w-0 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-sm text-gray-400 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shifts trend chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-4">מגמת משמרות</h3>
              {shiftsByDay.length === 0 ? (
                <div className="h-48 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
                  <p className="text-gray-500 text-sm">אין נתונים לטווח הזה</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={shiftsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="משמרות" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status pie chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-4">פילוח סטטוסים</h3>
              {pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
                  <p className="text-gray-500 text-sm">אין נתונים לטווח הזה</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CHATTERS TAB ══════════ */}
      {activeTab === 'chatters' && (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          {chatterIncomes.length === 0 ? (
            <p className="text-gray-500 text-center py-12">אין נתוני צ׳אטרים לטווח הנבחר</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-400 text-sm">
                    <th className="py-3 px-4 font-medium whitespace-nowrap">צ׳אטר</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">הכנסה כוללת</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">סיכומים</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">ממוצע לסיכום</th>
                  </tr>
                </thead>
                <tbody>
                  {chatterIncomes.map((c, i) => {
                    const summaryCount = c.summaryCount || 1;
                    const avg = Math.round((c.totalIncome || 0) / summaryCount);
                    return (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-3 px-4 text-white font-medium whitespace-nowrap">{c.chatterName}</td>
                        <td className="py-3 px-4 text-green-400 font-bold whitespace-nowrap">${(c.totalIncome || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-300 whitespace-nowrap">{c.summaryCount || '—'}</td>
                        <td className="py-3 px-4 text-gray-300 whitespace-nowrap">${avg.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ PLATFORMS TAB ══════════ */}
      {activeTab === 'platforms' && (
        <div className="bg-gray-900 rounded-xl p-6 space-y-4 min-w-0">
          <h3 className="text-white font-bold">פילוח לפי פלטפורמה</h3>
          {platformEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין נתוני פלטפורמות</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={platformEntries.map(([k, v]) => ({
                  name: k === 'telegram' ? 'טלגרם' : k === 'onlyfans' ? 'אונליפאנס' : 'העברות',
                  amount: v,
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="amount" name="הכנסה" radius={[0, 4, 4, 0]}>
                    {platformEntries.map(([k], i) => (
                      <Cell key={i} fill={k === 'telegram' ? '#3b82f6' : k === 'onlyfans' ? '#ec4899' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {platformEntries.map(([platform, amount]) => {
                  const pct = Math.round((amount / platformTotal) * 100);
                  const label = platform === 'telegram' ? 'טלגרם' : platform === 'onlyfans' ? 'אונליפאנס' : 'העברות';
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-white text-sm">{label}</span>
                        <span className="text-gray-400 text-sm whitespace-nowrap">${amount.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div className={`h-3 rounded-full ${platform === 'telegram' ? 'bg-blue-500' : platform === 'onlyfans' ? 'bg-pink-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════ GOALS TAB ══════════ */}
      {activeTab === 'goals' && (
        <div className="bg-gray-900 rounded-xl p-6 space-y-4 min-w-0">
          <h3 className="text-white font-bold">התקדמות יעדים חודשיים</h3>
          {goalProgress.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין יעדים מוגדרים לחודש הנוכחי</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(200, goalProgress.length * 50)}>
                <BarChart data={goalProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${v.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                  <Bar dataKey="current" name="הכנסה נוכחית" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="goalAmount" name="יעד" fill="#374151" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {goalProgress.map((g, i) => {
                  const pct = Math.min(100, Math.round((g.current / g.goalAmount) * 100));
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-white text-sm">{g.name}</span>
                        <span className="text-gray-400 text-sm whitespace-nowrap">${g.current.toLocaleString()} / ${g.goalAmount.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
