import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Calendar, Clock, FileText, Plus } from 'lucide-react';
import { getAnalyticsOverview, getChatters, getMonthlyGoals, getSummaryDebts, createModel, upsertMonthlyGoal, copyMonthlyGoals } from '../../services/api.js';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatCurrency(n) {
  return '$' + Number(n || 0).toLocaleString();
}

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [chatters, setChatters] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [currentMonth] = useState(getCurrentMonth);

  const [modelName, setModelName] = useState('');
  const [telegram, setTelegram] = useState(true);
  const [onlyfans, setOnlyfans] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editGoalValue, setEditGoalValue] = useState('');
  const [copyingGoals, setCopyingGoals] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, chattersData, goalsData, debtsData] = await Promise.allSettled([
        getAnalyticsOverview(),
        getChatters(),
        getMonthlyGoals(currentMonth),
        getSummaryDebts(),
      ]);
      setOverview(overviewData.status === 'fulfilled' ? overviewData.value : null);
      setChatters(chattersData.status === 'fulfilled' ? chattersData.value : []);
      setGoals(goalsData.status === 'fulfilled' && Array.isArray(goalsData.value) ? goalsData.value : []);
      setDebts(debtsData.status === 'fulfilled' && Array.isArray(debtsData.value) ? debtsData.value : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddModel = async (e) => {
    e.preventDefault();
    if (!modelName.trim()) return;
    try {
      setSubmitting(true);
      await createModel({ name: modelName.trim(), telegram, onlyfans });
      setModelName('');
      setTelegram(true);
      setOnlyfans(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGoal = async (goal) => {
    try {
      await upsertMonthlyGoal({
        chatter_id: goal.chatter_id,
        month: currentMonth,
        goal_amount: Number(editGoalValue),
      });
      setGoals((prev) =>
        prev.map((g) =>
          g._id === goal._id ? { ...g, goal_amount: Number(editGoalValue) } : g
        )
      );
      setEditingGoalId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCopyGoals = async () => {
    try {
      setCopyingGoals(true);
      await copyMonthlyGoals();
      const goalsData = await getMonthlyGoals(currentMonth);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
    } catch (err) {
      alert(err.message);
    } finally {
      setCopyingGoals(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  const kpis = [
    { label: 'צ׳אטרים', value: chatters.length, icon: Users },
    { label: 'מאושרות היום', value: overview?.shiftsToday ?? 0, icon: TrendingUp },
    { label: 'סה״כ בקשות היום', value: overview?.shiftRequestsToday ?? 0, icon: Calendar },
    { label: 'ממתינים לאישור', value: overview?.pendingApprovals ?? 0, icon: Clock, badge: 'חדש', badgeColor: 'bg-green-600' },
    { label: 'חובות סיכום יום', value: debts.length, icon: FileText, badge: 'לבדיקה', badgeColor: 'bg-blue-600' },
    { label: 'הושלמו (נתוני עבר)', value: `${overview?.completionRate ?? 0}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{kpi.value}</p>
              <p className="text-sm text-gray-400 mt-1">{kpi.label}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <kpi.icon className="w-5 h-5 text-gray-500" />
              {kpi.badge && (
                <span className={`${kpi.badgeColor} text-white text-xs px-2 py-0.5 rounded-full`}>
                  {kpi.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white">הוסף מיוצגת</h2>
        <p className="text-sm text-gray-400 mb-4">יצירה מהירה ושמירה בטבלת המיוצגות בדאטה בייס</p>
        <form onSubmit={handleAddModel} className="space-y-4">
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="שם המיוצגת"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input type="checkbox" checked={telegram} onChange={(e) => setTelegram(e.target.checked)} className="rounded bg-gray-700 border-gray-600" />
              טלגרם
            </label>
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input type="checkbox" checked={onlyfans} onChange={(e) => setOnlyfans(e.target.checked)} className="rounded bg-gray-700 border-gray-600" />
              אונלי
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting || !modelName.trim()}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4 inline-block ml-2" />
            הוסף מיוצגת
          </button>
        </form>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">יעדים חודשיים</h2>
          <button
            onClick={handleCopyGoals}
            disabled={copyingGoals}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {copyingGoals ? 'מעתיק...' : 'העתק יעדים מחודש קודם'}
          </button>
        </div>
        {goals.length === 0 ? (
          <p className="text-gray-500 text-center py-6">אין יעדים לחודש הנוכחי</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">צ׳אטר</th>
                  <th className="py-3 px-4 font-medium">יעד חודשי ($)</th>
                  <th className="py-3 px-4 font-medium">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => (
                  <tr key={goal._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white">{goal.chatterId?.name || goal.chatter_name || '—'}</td>
                    <td className="py-3 px-4 text-white">
                      {editingGoalId === goal._id ? (
                        <input
                          type="number"
                          value={editGoalValue}
                          onChange={(e) => setEditGoalValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal(goal)}
                          className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white w-32 focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        formatCurrency(goal.goal_amount)
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingGoalId === goal._id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveGoal(goal)} className="text-green-500 hover:text-green-400 text-sm">שמור</button>
                          <button onClick={() => setEditingGoalId(null)} className="text-gray-400 hover:text-gray-300 text-sm">בטל</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingGoalId(goal._id); setEditGoalValue(goal.goal_amount || ''); }}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          ערוך
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
