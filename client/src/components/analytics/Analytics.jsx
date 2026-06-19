import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Clock, Activity, Target } from 'lucide-react';
import { getAnalyticsOverview, getAnalyticsIncome, getAnalyticsShifts } from '../../services/api.js';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

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

export default function Analytics() {
  const [activeRange, setActiveRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [income, setIncome] = useState(null);
  const [shiftsData, setShiftsData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { start, end } = getDateRange(activeRange);
      const [overviewData, incomeData, shiftsRes] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsIncome(start, end),
        getAnalyticsShifts(start, end),
      ]);
      setOverview(overviewData);
      setIncome(incomeData);
      setShiftsData(shiftsRes);
    } catch (err) {
      setError(err.message);
    }
  }, [activeRange]);

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
    { label: 'הושלמו (נתוני עבר)', value: `${overview?.completion_rate ?? 0}%`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'איחור ממוצע (נתוני עבר)', value: overview?.avg_delay ? `${overview.avg_delay} דק׳` : '0 דק׳', icon: Clock, color: 'text-amber-400' },
    { label: 'סטטוסות פעילות (נתוני עבר)', value: overview?.active_statuses ?? 0, icon: Activity, color: 'text-blue-400' },
    { label: 'התקדמות יעד חודשי', value: `${overview?.goal_progress ?? 0}%`, icon: Target, color: 'text-purple-400' },
  ];

  const chatterIncomes = Array.isArray(income?.chatters) ? income.chatters : [];
  const platformData = income?.platforms || {};
  const goalProgress = Array.isArray(income?.goals) ? income.goals : [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">אנליטיקס</h1>
          <span className="bg-green-900 text-green-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            חי
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          רענן
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIME_RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => r.key !== 'custom' && setActiveRange(r.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeRange === r.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-4">מגמת סטטוס שבועית</h3>
              <div className="h-48 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
                <p className="text-gray-500 text-sm">אין נתונים לטווח הזה</p>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-4">פילוח פלטפורמות</h3>
              <div className="h-48 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
                <p className="text-gray-500 text-sm">אין נתונים לטווח הזה</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chatters' && (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          {chatterIncomes.length === 0 ? (
            <p className="text-gray-500 text-center py-12">אין נתוני צ׳אטרים לטווח הנבחר</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-400 text-sm">
                    <th className="py-3 px-4 font-medium">צ׳אטר</th>
                    <th className="py-3 px-4 font-medium">הכנסה כוללת</th>
                    <th className="py-3 px-4 font-medium">משמרות</th>
                    <th className="py-3 px-4 font-medium">ממוצע למשמרת</th>
                  </tr>
                </thead>
                <tbody>
                  {chatterIncomes.map((c, i) => (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-white font-medium">{c.name || c.chatter_name}</td>
                      <td className="py-3 px-4 text-green-400 font-bold">${(c.total_income || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-300">{c.shift_count || 0}</td>
                      <td className="py-3 px-4 text-gray-300">${(c.avg_income || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'platforms' && (
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-bold">פילוח לפי פלטפורמה</h3>
          {Object.keys(platformData).length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין נתוני פלטפורמות</p>
          ) : (
            Object.entries(platformData).map(([platform, data]) => {
              const total = Object.values(platformData).reduce((s, d) => s + (d.income || 0), 0) || 1;
              const pct = Math.round(((data.income || 0) / total) * 100);
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{platform === 'telegram' ? 'טלגרם' : 'אונליפאנס'}</span>
                    <span className="text-gray-400 text-sm">${(data.income || 0).toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${platform === 'telegram' ? 'bg-blue-500' : 'bg-pink-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="bg-gray-900 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-bold">התקדמות יעדים חודשיים</h3>
          {goalProgress.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין נתוני יעדים</p>
          ) : (
            goalProgress.map((g, i) => {
              const pct = g.goal_amount ? Math.min(100, Math.round((g.current || 0) / g.goal_amount * 100)) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{g.chatter_name || g.name}</span>
                    <span className="text-gray-400 text-sm">${(g.current || 0).toLocaleString()} / ${(g.goal_amount || 0).toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
