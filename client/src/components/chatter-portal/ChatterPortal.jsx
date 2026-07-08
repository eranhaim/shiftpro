import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogOut, Calendar, FileText, Clock,
  ChevronRight, ChevronLeft, Target, TrendingUp,
  CheckCircle, XCircle, Loader2,
} from 'lucide-react';

const API = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

function getHebrewDayName(dateStr) {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return days[new Date(dateStr).getDay()];
}

function getHebrewDate() {
  const now = new Date();
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return `יום ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const statusMap = {
  pending: { label: 'ממתין לאישור', cls: 'bg-yellow-900/60 text-yellow-400' },
  approved: { label: 'מאושר', cls: 'bg-green-900/60 text-green-400' },
  rejected: { label: 'נדחה', cls: 'bg-red-900/60 text-red-400' },
  scheduled: { label: 'מתוכנן', cls: 'bg-blue-900/60 text-blue-400' },
  completed: { label: 'הושלם', cls: 'bg-gray-700/60 text-gray-300' },
  cancelled: { label: 'בוטל', cls: 'bg-gray-700/60 text-gray-500' },
  active: { label: 'פעיל', cls: 'bg-emerald-900/60 text-emerald-400' },
};

/* ────────── SummaryWizard ────────── */

function SummaryWizard({ models, shiftId, onClose, onSuccess, setError }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shiftType: '',
    modelPlatforms: [],
    availabilityStatus: 'full',
    availabilityGaps: '',
    hasDebts: false,
    debtsDetail: '',
    hasPendingSales: false,
    pendingSalesDetail: '',
    hasUnusualEvents: false,
    unusualEventsDetail: '',
    allDepositsVerified: true,
    incomeTelegram: 0,
    incomeOnlyfans: 0,
    incomeTransfers: 0,
    incomeOther: 0,
    improvementSuggestions: '',
    contentRequest: '',
    selfImprovementPoint: '',
    selfPreservationPoint: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleModelPlatform = (modelId, platform) => {
    const key = `${modelId}__${platform}`;
    setForm(prev => {
      const current = prev.modelPlatforms;
      return {
        ...prev,
        modelPlatforms: current.includes(key)
          ? current.filter(k => k !== key)
          : [...current, key],
      };
    });
  };

  const incomeTotal = Number(form.incomeTelegram) + Number(form.incomeOnlyfans) + Number(form.incomeTransfers) + Number(form.incomeOther);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/chatter-portal/submit-summary`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...form, shiftId, incomeTotal }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'שגיאה');
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  const shiftTypes = ['בוקר', 'ערב', 'כפולה'];
  const platforms = ['telegram', 'onlyfans'];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">סיכום יומי</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors ${s === step ? 'bg-blue-500' : s < step ? 'bg-blue-700' : 'bg-gray-700'}`} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-400">רקע פעילות</h3>
            <div>
              <label className="text-xs text-gray-400 block mb-1">תאריך</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              {form.date && <p className="text-xs text-gray-500 mt-1">יום {getHebrewDayName(form.date)}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">סוג משמרת</label>
              <div className="flex gap-2">
                {shiftTypes.map(t => (
                  <button key={t} type="button" onClick={() => set('shiftType', t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.shiftType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">מודלים ופלטפורמות</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {models.map(m => (
                  <div key={m._id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2">
                    <span className="text-sm text-white flex-1 truncate">{m.name}</span>
                    {platforms.map(p => (
                      <label key={p} className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox"
                          checked={form.modelPlatforms.includes(`${m._id}__${p}`)}
                          onChange={() => toggleModelPlatform(m._id, p)}
                          className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500" />
                        <span className="text-xs text-gray-400">{p === 'telegram' ? 'טלגרם' : 'אונלי'}</span>
                      </label>
                    ))}
                  </div>
                ))}
                {models.length === 0 && <p className="text-xs text-gray-500 text-center py-2">אין מודלים זמינים</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">סטטוס זמינות</label>
              <select value={form.availabilityStatus} onChange={e => set('availabilityStatus', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option value="full">זמינות מלאה</option>
                <option value="partial">זמינות חלקית</option>
                <option value="absent">לא זמין/ה</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">פירוט פערי זמינות</label>
              <textarea value={form.availabilityGaps} onChange={e => set('availabilityGaps', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
            </div>
            <RadioYesNo label="האם יש חובות פתוחים?" value={form.hasDebts} onChange={v => set('hasDebts', v)} />
            {form.hasDebts && (
              <textarea value={form.debtsDetail} onChange={e => set('debtsDetail', e.target.value)} placeholder="פירוט חובות..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
            )}
            <RadioYesNo label="האם יש מכירות ממתינות?" value={form.hasPendingSales} onChange={v => set('hasPendingSales', v)} />
            {form.hasPendingSales && (
              <textarea value={form.pendingSalesDetail} onChange={e => set('pendingSalesDetail', e.target.value)} placeholder="פירוט מכירות..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <RadioYesNo label="האם היו אירועים חריגים?" value={form.hasUnusualEvents} onChange={v => set('hasUnusualEvents', v)} />
            {form.hasUnusualEvents && (
              <textarea value={form.unusualEventsDetail} onChange={e => set('unusualEventsDetail', e.target.value)} placeholder="פירוט אירועים חריגים..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={3} />
            )}
            <RadioYesNo label="כל ההפקדות אומתו?" value={form.allDepositsVerified} onChange={v => set('allDepositsVerified', v)} />
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-400">הכנסות</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">טלגרם <span className="text-yellow-500">€</span></label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 text-sm font-medium">€</span>
                  <input type="number" min="0" value={form.incomeTelegram} onChange={e => set('incomeTelegram', e.target.value)} onFocus={e => e.target.select()} onClick={e => e.target.select()}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">אונליפאנס <span className="text-green-500">$</span></label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm font-medium">$</span>
                  <input type="number" min="0" value={form.incomeOnlyfans} onChange={e => set('incomeOnlyfans', e.target.value)} onFocus={e => e.target.select()} onClick={e => e.target.select()}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">העברות בנקאיות <span className="text-blue-400">₪</span></label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-medium">₪</span>
                  <input type="number" min="0" value={form.incomeTransfers} onChange={e => set('incomeTransfers', e.target.value)} onFocus={e => e.target.select()} onClick={e => e.target.select()}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <p className="text-xs text-gray-600 mt-0.5">כולל מע&quot;מ 18%</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">אחר <span className="text-blue-400">₪</span></label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-medium">₪</span>
                  <input type="number" min="0" value={form.incomeOther} onChange={e => set('incomeOther', e.target.value)} onFocus={e => e.target.select()} onClick={e => e.target.select()}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pr-7 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <p className="text-xs text-gray-600 mt-0.5">כולל מע&quot;מ 18%</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-blue-400 pt-2">רפלקציה</h3>
            <div>
              <label className="text-xs text-gray-400 block mb-1">הצעות לשיפור</label>
              <textarea value={form.improvementSuggestions} onChange={e => set('improvementSuggestions', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">בקשת תוכן</label>
              <textarea value={form.contentRequest} onChange={e => set('contentRequest', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">נקודה לשיפור עצמי</label>
              <textarea value={form.selfImprovementPoint} onChange={e => set('selfImprovementPoint', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">נקודה לשימור עצמי</label>
              <textarea value={form.selfPreservationPoint} onChange={e => set('selfPreservationPoint', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" /> חזרה
            </button>
          ) : <div />}
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              הבא <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'שולח...' : 'שלח סיכום'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────── ChatterPortal ────────── */

export default function ChatterPortal() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('myShifts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [shifts, setShifts] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [nextShift, setNextShift] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [monthlyGoal, setMonthlyGoal] = useState(null);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [models, setModels] = useState([]);

  const [reqDate, setReqDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqMorning, setReqMorning] = useState(false);
  const [reqNight, setReqNight] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const [wizardShiftId, setWizardShiftId] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  const [schedule, setSchedule] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftsRes, summariesRes, nextRes, statsRes, goalRes, availRes, modelsRes] = await Promise.all([
        fetch(`${API}/chatter-portal/my-shifts`, { headers: getHeaders() }),
        fetch(`${API}/chatter-portal/my-summaries`, { headers: getHeaders() }),
        fetch(`${API}/chatter-portal/next-shift`, { headers: getHeaders() }),
        fetch(`${API}/chatter-portal/weekly-stats`, { headers: getHeaders() }),
        fetch(`${API}/chatter-portal/monthly-goal`, { headers: getHeaders() }),
        fetch(`${API}/chatter-portal/available-shifts`, { headers: getHeaders() }),
        fetch(`${API}/models`, { headers: getHeaders() }),
      ]);
      if (shiftsRes.ok) setShifts(await shiftsRes.json());
      if (summariesRes.ok) setSummaries(await summariesRes.json());
      if (nextRes.ok) setNextShift(await nextRes.json());
      if (statsRes.ok) setWeeklyStats(await statsRes.json());
      if (goalRes.ok) setMonthlyGoal(await goalRes.json());
      if (availRes.ok) setAvailableShifts(await availRes.json());
      if (modelsRes.ok) setModels(await modelsRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const loadSchedule = useCallback(async () => {
    const ws = getWeekStart(new Date());
    ws.setDate(ws.getDate() + weekOffset * 7);
    try {
      const res = await fetch(`${API}/chatter-portal/schedule?weekStart=${ws.toISOString().split('T')[0]}`, { headers: getHeaders() });
      if (res.ok) setSchedule(await res.json());
    } catch { /* ignore */ }
  }, [weekOffset]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  async function submitShiftRequest(e) {
    e.preventDefault();
    if (!reqMorning && !reqNight) { setError('יש לבחור לפחות סוג משמרת אחד'); return; }
    setRequesting(true);
    setError('');
    try {
      const requests = [];
      if (reqMorning) {
        requests.push(
          fetch(`${API}/chatter-portal/register-shift`, {
            method: 'POST', headers: getHeaders(),
            body: JSON.stringify({ date: reqDate, startTime: '12:00', endTime: '19:00', type: 'morning' }),
          })
        );
      }
      if (reqNight) {
        requests.push(
          fetch(`${API}/chatter-portal/register-shift`, {
            method: 'POST', headers: getHeaders(),
            body: JSON.stringify({ date: reqDate, startTime: '19:00', endTime: '02:00', type: 'night' }),
          })
        );
      }
      const results = await Promise.all(requests);
      for (const res of results) {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'שגיאה ברישום');
        }
      }
      setReqMorning(false);
      setReqNight(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
    setRequesting(false);
  }

  async function cancelShift(shiftId) {
    if (!confirm('האם לבטל את המשמרת?')) return;
    setError('');
    try {
      const res = await fetch(`${API}/chatter-portal/cancel-shift/${shiftId}`, { method: 'PUT', headers: getHeaders() });
      if (!res.ok) throw new Error((await res.json()).message || 'שגיאה');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function hasSummary(shiftId) {
    return summaries.some(s => s.shiftId === shiftId);
  }

  const upcomingShifts = shifts.filter(s => ['approved', 'scheduled', 'pending', 'active'].includes(s.status) && new Date(s.date) >= new Date(new Date().toDateString()));
  const previousShifts = shifts.filter(s => new Date(s.date) < new Date(new Date().toDateString()) || s.status === 'completed');

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  function getWeekDates() {
    const ws = getWeekStart(new Date());
    ws.setDate(ws.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  const weekDates = getWeekDates();

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">ShiftPro</h1>
          <p className="text-xs text-gray-400 truncate">{getHebrewDate()}</p>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors shrink-0" title="התנתק">
          <LogOut size={20} />
        </button>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Dashboard section */}
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-bold">היי {user?.name || user?.email}!</h2>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm break-words">{error}</div>}

          {/* Open summary button */}
          <button onClick={() => { setWizardShiftId(null); setShowWizard(true); }}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            פתח סיכום יומי
          </button>

          {/* Previous shifts with summary status */}
          {previousShifts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400">משמרות קודמות</h3>
              {previousShifts.slice(0, 5).map(s => (
                <div key={s._id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-white">{formatDate(s.date)}</span>
                    <span className="text-xs text-gray-500">{s.startTime}–{s.endTime}</span>
                  </div>
                  {hasSummary(s._id) ? (
                    <span className="text-xs bg-green-900/60 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> סיכום נשלח
                    </span>
                  ) : (
                    <button onClick={() => { setWizardShiftId(s._id); setShowWizard(true); }}
                      className="text-xs bg-yellow-900/60 text-yellow-400 px-2 py-0.5 rounded-full whitespace-nowrap hover:bg-yellow-800/60 transition-colors">
                      מלא סיכום
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900 border-y border-gray-800 sticky top-[57px] z-30">
          <button onClick={() => setTab('myShifts')}
            className={`flex-1 py-3 text-sm font-medium transition-colors text-center ${tab === 'myShifts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
            <Calendar className="w-4 h-4 inline ml-1" />
            המשמרות שלי
          </button>
          <button onClick={() => setTab('schedule')}
            className={`flex-1 py-3 text-sm font-medium transition-colors text-center ${tab === 'schedule' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
            <Clock className="w-4 h-4 inline ml-1" />
            לוח משמרות
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading && (
            <div className="text-center py-8 text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> טוען...
            </div>
          )}

          {/* ── My Shifts Tab ── */}
          {tab === 'myShifts' && !loading && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <TrendingUp className="w-3.5 h-3.5" /> משמרות השבוע
                  </div>
                  <span className="text-xl font-bold text-white">{weeklyStats?.count ?? '–'}</span>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Target className="w-3.5 h-3.5" /> יעד חודשי
                  </div>
                  {monthlyGoal ? (
                    <>
                      <span className="text-xl font-bold text-white">{monthlyGoal.current}/{monthlyGoal.target}</span>
                      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (monthlyGoal.current / monthlyGoal.target) * 100)}%` }} />
                      </div>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-white">–</span>
                  )}
                </div>
              </div>

              {/* Next shift */}
              {nextShift && nextShift._id && (
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-2">
                    <Clock className="w-3.5 h-3.5" /> המשמרת הבאה
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">{formatDate(nextShift.date)}</span>
                      <span className="text-gray-400 text-sm mr-2">{nextShift.startTime}–{nextShift.endTime}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${(statusMap[nextShift.status] || statusMap.pending).cls}`}>
                      {(statusMap[nextShift.status] || statusMap.pending).label}
                    </span>
                  </div>
                </div>
              )}

              {/* Upcoming shifts */}
              {upcomingShifts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400">משמרות קרובות</h3>
                  {upcomingShifts.map(s => {
                    const st = statusMap[s.status] || statusMap.pending;
                    return (
                      <div key={s._id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-white font-medium">{formatDate(s.date)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{s.startTime}–{s.endTime}</span>
                          </div>
                          {['pending', 'approved', 'scheduled'].includes(s.status) && (
                            <button onClick={() => cancelShift(s._id)}
                              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> ביטול משמרת
                            </button>
                          )}
                        </div>
                        {(s.assignments || []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {s.assignments.map((a, i) => (
                              <span key={i} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded truncate max-w-[200px]">
                                {a.modelName} · {a.platform === 'telegram' ? 'טלגרם' : 'אונלי'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Shift request form */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">בקשת משמרת</h3>
                <form onSubmit={submitShiftRequest} className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">תאריך</label>
                    <input type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} required
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={reqMorning} onChange={e => setReqMorning(e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500" />
                      <span className="text-sm text-white">בוקר 12:00–19:00</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={reqNight} onChange={e => setReqNight(e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500" />
                      <span className="text-sm text-white">לילה 19:00–02:00</span>
                    </label>
                  </div>
                  <button type="submit" disabled={requesting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {requesting ? 'שולח...' : 'שלח בקשה'}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ── Schedule Tab ── */}
          {tab === 'schedule' && !loading && (
            <>
              {/* Week navigation */}
              <div className="flex items-center justify-between">
                <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-sm text-white font-medium">
                    {formatDate(weekDates[0].toISOString())} – {formatDate(weekDates[6].toISOString())}
                  </span>
                  {weekOffset !== 0 && (
                    <button onClick={() => setWeekOffset(0)} className="block mx-auto text-xs text-blue-400 hover:text-blue-300 mt-1">
                      חזרה לשבוע נוכחי
                    </button>
                  )}
                </div>
                <button onClick={() => setWeekOffset(o => o + 1)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Schedule grid */}
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="bg-gray-900 border border-gray-800 px-2 py-2 text-gray-400 text-right sticky right-0 z-10 min-w-[80px]">צ׳אטר</th>
                      {weekDates.map((d, i) => {
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                          <th key={i} className={`border border-gray-800 px-2 py-2 text-center min-w-[80px] ${isToday ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-900 text-gray-400'}`}>
                            <div>{dayNames[i]}</div>
                            <div className="text-[10px] opacity-70">{d.getDate()}/{d.getMonth() + 1}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(schedule) ? schedule : []).map((row) => {
                      const isMe = row.chatterId === user?._id || row.chatterName === user?.name;
                      return (
                        <tr key={row.chatterId || row.chatterName} className={isMe ? 'bg-blue-900/10' : ''}>
                          <td className={`border border-gray-800 px-2 py-2 text-right sticky right-0 z-10 font-medium whitespace-nowrap ${isMe ? 'bg-blue-900/20 text-blue-300' : 'bg-gray-900 text-white'}`}>
                            {row.chatterName}{isMe ? ' (את/ה)' : ''}
                          </td>
                          {weekDates.map((d, di) => {
                            const dateKey = d.toISOString().split('T')[0];
                            const dayShifts = (row.days || {})[dateKey] || [];
                            return (
                              <td key={di} className="border border-gray-800 px-1 py-1 text-center align-top">
                                {dayShifts.map((ds, si) => (
                                  <div key={si} className={`text-[10px] rounded px-1 py-0.5 mb-0.5 ${ds.type === 'morning' ? 'bg-amber-900/40 text-amber-400' : 'bg-indigo-900/40 text-indigo-400'}`}>
                                    <div>{ds.type === 'morning' ? 'בוקר' : 'ערב'}</div>
                                    {ds.model && <div className="opacity-70 truncate">{ds.model}</div>}
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {(!Array.isArray(schedule) || schedule.length === 0) && (
                      <tr>
                        <td colSpan={8} className="border border-gray-800 px-4 py-8 text-center text-gray-500">
                          אין נתונים לשבוע זה
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Wizard */}
      {showWizard && (
        <SummaryWizard
          models={models}
          shiftId={wizardShiftId}
          onClose={() => setShowWizard(false)}
          onSuccess={() => { setShowWizard(false); loadData(); }}
          setError={setError}
        />
      )}
    </div>
  );
}

/* ────────── RadioYesNo ────────── */

function RadioYesNo({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <div className="flex gap-3">
        <button type="button" onClick={() => onChange(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${value ? 'bg-red-600/30 text-red-400 border border-red-600/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
          כן
        </button>
        <button type="button" onClick={() => onChange(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!value ? 'bg-green-600/30 text-green-400 border border-green-600/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
          לא
        </button>
      </div>
    </div>
  );
}
