import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { getDailySummaries, getSummaryDebts } from '../../services/api.js';

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
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function formatTime(t) {
  if (!t) return '';
  return t.slice(0, 5);
}

export default function DailySummaries() {
  const [summaries, setSummaries] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [summariesData, debtsData] = await Promise.all([
        getDailySummaries({}),
        getSummaryDebts(),
      ]);
      setSummaries(Array.isArray(summariesData) ? summariesData : []);
      setDebts(Array.isArray(debtsData) ? debtsData : []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const uniqueChatters = new Set(summaries.map((s) => s.chatter_name || s.chatter?.name)).size;
  const totalIncome = summaries.reduce((sum, s) => sum + (s.income || 0), 0);
  const onlyIncome = summaries.reduce((sum, s) => sum + (s.only_income || 0), 0);
  const transferIncome = summaries.reduce((sum, s) => sum + (s.transfer_income || s.mop_income || 0), 0);

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="space-y-6 pb-20" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">סיכומי יום</h1>
          <p className="text-gray-400 text-sm mt-1">כל הסיכומים מקובצים לפי שם מלא של הצ׳אטר</p>
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

      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-lg font-bold text-white">חובות סיכום יום</h2>
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{debts.length}</span>
        </div>
        <p className="text-sm text-gray-400 mb-4">חלונות משמרת שחייבים סיכום ועדיין לא נמצא להם סיכום יום:</p>

        {debts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-gray-400">אין חובות סיכום</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {debts.map((debt, i) => (
              <div key={debt.id || i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-white">{debt.chatter_name || debt.chatter?.name || 'לא ידוע'}</p>
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <p className="text-sm text-gray-400">{formatDate(debt.date)}</p>
                <p className="text-sm text-gray-500">{formatTime(debt.start_time)} - {formatTime(debt.end_time)}</p>
                {(debt.assignments || debt.models || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(debt.assignments || debt.models || []).map((a, ai) => (
                      <span key={ai} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {a.model_name || a.name} · {a.platform === 'telegram' ? 'טלגרם' : 'אונלי'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {summaries.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">סיכומים אחרונים</h2>
          <div className="space-y-2">
            {summaries.map((s, i) => (
              <div key={s.id || i} className="bg-gray-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-white font-medium">{s.chatter_name || s.chatter?.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(s.date)}</p>
                </div>
                <div className="text-left">
                  <p className="text-green-400 font-bold">${(s.income || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm" dir="rtl">
          <div className="text-gray-400">
            סיכומים <span className="text-white font-bold">{summaries.length}</span>
          </div>
          <div className="text-gray-400">
            צ׳אטרים <span className="text-white font-bold">{uniqueChatters}</span>
          </div>
          <div className="text-gray-400">
            סף הכנסה <span className="text-white font-bold">${totalIncome.toLocaleString()}</span>
          </div>
          <div className="text-gray-400">
            אונלי היום <span className="text-white font-bold">${onlyIncome.toLocaleString()}</span>
          </div>
          <div className="text-gray-400">
            העברות/MOP היום <span className="text-white font-bold">${transferIncome.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
