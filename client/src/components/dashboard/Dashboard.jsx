import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Calendar, Clock, FileText, Plus, ClipboardCheck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAnalyticsOverview, getChatters, getMonthlyGoals, getSummaryDebts, createModel, upsertMonthlyGoal, copyMonthlyGoals, getPendingShifts } from '../../services/api.js';
import ShiftApprovalModal from '../approval/ShiftApprovalModal.jsx';

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

export default function Dashboard({ onNavigate }) {
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

  const [pendingShifts, setPendingShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, chattersData, goalsData, debtsData, pendingData] = await Promise.allSettled([
        getAnalyticsOverview(),
        getChatters(),
        getMonthlyGoals(currentMonth),
        getSummaryDebts(),
        getPendingShifts(),
      ]);
      setOverview(overviewData.status === 'fulfilled' ? overviewData.value : null);
      setChatters(chattersData.status === 'fulfilled' ? chattersData.value : []);
      setGoals(goalsData.status === 'fulfilled' && Array.isArray(goalsData.value) ? goalsData.value : []);
      setDebts(debtsData.status === 'fulfilled' && Array.isArray(debtsData.value) ? debtsData.value : []);
      setPendingShifts(pendingData.status === 'fulfilled' && Array.isArray(pendingData.value) ? pendingData.value : []);
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
      await createModel({ name: modelName.trim(), platforms: { telegram, onlyfans } });
      setModelName('');
      setTelegram(true);
      setOnlyfans(true);
      toast.success('מיוצגת נוספה');
    } catch (err) {
      toast.error(err.message);
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
      toast.success('יעד עודכן');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCopyGoals = async () => {
    try {
      setCopyingGoals(true);
      await copyMonthlyGoals();
      const goalsData = await getMonthlyGoals(currentMonth);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      toast.success('יעדים הועתקו');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCopyingGoals(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  const kpis = [
    { label: 'צ׳אטרים', value: chatters.length, icon: Users, page: 'chatters' },
    { label: 'מאושרות היום', value: overview?.shiftsToday ?? 0, icon: TrendingUp, page: 'shifts' },
    { label: 'סה״כ בקשות היום', value: overview?.shiftRequestsToday ?? 0, icon: Calendar, page: 'shifts' },
    { label: 'ממתינים לאישור', value: pendingShifts.length, icon: Clock, badge: pendingShifts.length > 0 ? 'חדש' : null, badgeColor: 'bg-green-600', scrollTo: 'pending-shifts' },
    { label: 'חובות סיכום יום', value: debts.length, icon: FileText, badge: 'לבדיקה', badgeColor: 'bg-blue-600', page: 'summaries' },
    { label: 'הושלמו (נתוני עבר)', value: `${overview?.completionRate ?? 0}%`, icon: TrendingUp, page: 'analytics' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => {
              if (kpi.scrollTo) {
                document.getElementById(kpi.scrollTo)?.scrollIntoView({ behavior: 'smooth' });
              } else if (kpi.page) {
                onNavigate?.(kpi.page);
              }
            }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between overflow-hidden min-w-0 text-right hover:border-gray-600 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-3xl font-bold text-white whitespace-nowrap">{kpi.value}</p>
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
          </button>
        ))}
      </div>

      {/* Pending Shifts Section */}
      <div id="pending-shifts" className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">משמרות ממתינות לאישור</h2>
            {pendingShifts.length > 0 && (
              <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingShifts.length}
              </span>
            )}
          </div>
        </div>
        {pendingShifts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 text-green-500/50 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">אין משמרות ממתינות לאישור</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingShifts.map((shift) => {
              const shiftLabel = shift.startTime === '12:00' ? 'בוקר' : 'לילה';
              const shiftDate = new Date(shift.date);
              const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'];
              return (
                <button
                  key={shift._id}
                  onClick={() => setSelectedShift(shift)}
                  className="w-full bg-gray-800 border border-gray-700 hover:border-yellow-500/50 rounded-xl p-4 flex items-center justify-between gap-3 transition-all group text-right"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{shift.chatterId?.name || 'צ׳אטר'}</p>
                      <p className="text-xs text-gray-400">
                        יום {dayNames[shiftDate.getDay()]} {shiftDate.getDate()}.{shiftDate.getMonth() + 1} · {shiftLabel} ({shift.startTime}–{shift.endTime})
                      </p>
                    </div>
                  </div>
                  <span className="bg-yellow-900/60 text-yellow-400 text-xs px-3 py-1 rounded-full whitespace-nowrap group-hover:bg-yellow-800/60 transition-colors">
                    ממתין
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedShift && (
        <ShiftApprovalModal
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          onApproved={(id) => {
            setPendingShifts((prev) => prev.filter((s) => s._id !== id));
            setSelectedShift(null);
            fetchData();
          }}
          onRejected={(id) => {
            setPendingShifts((prev) => prev.filter((s) => s._id !== id));
            setSelectedShift(null);
            fetchData();
          }}
        />
      )}

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
          <div className="flex flex-wrap gap-x-6 gap-y-2">
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
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4 shrink-0" />
            הוסף מיוצגת
          </button>
        </form>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 className="text-lg font-bold text-white">יעדים חודשיים</h2>
          <button
            onClick={handleCopyGoals}
            disabled={copyingGoals}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
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
                  <th className="py-3 px-4 font-medium whitespace-nowrap">צ׳אטר</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">יעד חודשי ($)</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal) => (
                  <tr key={goal._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white whitespace-nowrap">{goal.chatterId?.name || goal.chatter_name || '—'}</td>
                    <td className="py-3 px-4 text-white whitespace-nowrap min-w-[8rem]">
                      {editingGoalId === goal._id ? (
                        <input
                          type="number"
                          value={editGoalValue}
                          onChange={(e) => setEditGoalValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal(goal)}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 text-white w-full max-w-[8rem] focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        formatCurrency(goal.goal_amount)
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
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
