import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Calendar, FileText, Plus, Clock } from 'lucide-react';

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

export default function ChatterPortal() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('shifts');
  const [shifts, setShifts] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request shift form
  const [showRequest, setShowRequest] = useState(false);
  const [reqDate, setReqDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqStart, setReqStart] = useState('12:00');
  const [reqEnd, setReqEnd] = useState('19:00');
  const [requesting, setRequesting] = useState(false);

  // Submit summary form
  const [showSummary, setShowSummary] = useState(false);
  const [sumDate, setSumDate] = useState(new Date().toISOString().split('T')[0]);
  const [sumType, setSumType] = useState('בוקר');
  const [sumTelegram, setSumTelegram] = useState(0);
  const [sumOnlyfans, setSumOnlyfans] = useState(0);
  const [sumTransfers, setSumTransfers] = useState(0);
  const [sumOther, setSumOther] = useState(0);
  const [sumAvailability, setSumAvailability] = useState('full');
  const [sumNotes, setSumNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [shiftsRes, summariesRes] = await Promise.all([
        fetch(`${API}/chatter-portal/my-shifts`, { headers: getHeaders() }),
        fetch(`${API}/chatter-portal/my-summaries`, { headers: getHeaders() }),
      ]);
      if (shiftsRes.ok) setShifts(await shiftsRes.json());
      if (summariesRes.ok) setSummaries(await summariesRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleRequestShift(e) {
    e.preventDefault();
    setRequesting(true);
    setError('');
    try {
      const res = await fetch(`${API}/chatter-portal/request-shift`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ date: reqDate, startTime: reqStart, endTime: reqEnd }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setShowRequest(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
    setRequesting(false);
  }

  async function handleSubmitSummary(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/chatter-portal/submit-summary`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          date: sumDate,
          shiftType: sumType,
          incomeTelegram: sumTelegram,
          incomeOnlyfans: sumOnlyfans,
          incomeTransfers: sumTransfers,
          incomeOther: sumOther,
          availabilityStatus: sumAvailability,
          improvementSuggestions: sumNotes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setShowSummary(false);
      setSumTelegram(0);
      setSumOnlyfans(0);
      setSumTransfers(0);
      setSumOther(0);
      setSumNotes('');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  const statusMap = {
    pending: { label: 'ממתין לאישור', cls: 'bg-yellow-900 text-yellow-400' },
    approved: { label: 'מאושר', cls: 'bg-green-900 text-green-400' },
    rejected: { label: 'נדחה', cls: 'bg-red-900 text-red-400' },
    scheduled: { label: 'מתוכנן', cls: 'bg-blue-900 text-blue-400' },
    completed: { label: 'הושלם', cls: 'bg-gray-700 text-gray-300' },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">ShiftPro</h1>
          <p className="text-xs text-gray-400 truncate">שלום, {user?.name || user?.email}</p>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-red-400 transition-colors shrink-0" title="התנתק">
          <LogOut size={20} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-900 border-b border-gray-800">
        <button onClick={() => setTab('shifts')} className={`flex-1 py-3 text-sm font-medium transition-colors text-center ${tab === 'shifts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
          <Calendar className="w-4 h-4 inline ml-1" />
          המשמרות שלי
        </button>
        <button onClick={() => setTab('summaries')} className={`flex-1 py-3 text-sm font-medium transition-colors text-center ${tab === 'summaries' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
          <FileText className="w-4 h-4 inline ml-1" />
          סיכומי יום
        </button>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4 pt-4">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm break-words">{error}</div>}

        {/* Shifts Tab */}
        {tab === 'shifts' && (
          <>
            <button onClick={() => setShowRequest(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              בקש משמרת
            </button>

            {loading ? (
              <div className="text-center py-8 text-gray-400">טוען...</div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>אין משמרות עדיין</p>
                <p className="text-sm mt-1">לחץ ״בקש משמרת״ כדי להתחיל</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shifts.map((s) => {
                  const st = statusMap[s.status] || statusMap.pending;
                  return (
                    <div key={s._id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-white font-medium truncate">{formatDate(s.date)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${st.cls}`}>{st.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{s.startTime} - {s.endTime}</span>
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
          </>
        )}

        {/* Summaries Tab */}
        {tab === 'summaries' && (
          <>
            <button onClick={() => setShowSummary(true)} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              הגש סיכום יום
            </button>

            {loading ? (
              <div className="text-center py-8 text-gray-400">טוען...</div>
            ) : summaries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>אין סיכומים עדיין</p>
              </div>
            ) : (
              <div className="space-y-2">
                {summaries.map((s) => (
                  <div key={s._id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-white font-medium">{formatDate(s.date)}</span>
                      <span className="text-green-400 font-bold whitespace-nowrap">${(s.incomeTotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-400">
                      <div className="whitespace-nowrap">טלגרם: ${s.incomeTelegram || 0}</div>
                      <div className="whitespace-nowrap">אונלי: ${s.incomeOnlyfans || 0}</div>
                      <div className="whitespace-nowrap">העברות: ${s.incomeTransfers || 0}</div>
                      <div className="whitespace-nowrap">אחר: ${s.incomeOther || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Shift Modal */}
      {showRequest && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setShowRequest(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">בקשת משמרת</h2>
            <form onSubmit={handleRequestShift} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">תאריך</label>
                <input type="date" value={reqDate} onChange={(e) => setReqDate(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">שעת התחלה</label>
                  <select value={reqStart} onChange={(e) => setReqStart(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="12:00">12:00 (בוקר)</option>
                    <option value="19:00">19:00 (ערב)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">שעת סיום</label>
                  <select value={reqEnd} onChange={(e) => setReqEnd(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="19:00">19:00</option>
                    <option value="02:00">02:00</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={requesting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {requesting ? 'שולח...' : 'שלח בקשה'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Submit Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setShowSummary(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">סיכום יום</h2>
            <form onSubmit={handleSubmitSummary} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">תאריך</label>
                  <input type="date" value={sumDate} onChange={(e) => setSumDate(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">סוג משמרת</label>
                  <select value={sumType} onChange={(e) => setSumType(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="בוקר">בוקר</option>
                    <option value="ערב">ערב</option>
                    <option value="כפולה">כפולה</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">טלגרם $</label>
                  <input type="number" min="0" value={sumTelegram} onChange={(e) => setSumTelegram(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">אונליפאנס $</label>
                  <input type="number" min="0" value={sumOnlyfans} onChange={(e) => setSumOnlyfans(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">העברות $</label>
                  <input type="number" min="0" value={sumTransfers} onChange={(e) => setSumTransfers(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">אחר $</label>
                  <input type="number" min="0" value={sumOther} onChange={(e) => setSumOther(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-400">סה"כ: </span>
                <span className="text-green-400 font-bold">${(Number(sumTelegram) + Number(sumOnlyfans) + Number(sumTransfers) + Number(sumOther)).toLocaleString()}</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">זמינות</label>
                <select value={sumAvailability} onChange={(e) => setSumAvailability(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="full">מלאה</option>
                  <option value="partial">חלקית</option>
                  <option value="absent">נעדר</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">הערות (אופציונלי)</label>
                <textarea value={sumNotes} onChange={(e) => setSumNotes(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" rows={2} />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {submitting ? 'שולח...' : 'הגש סיכום'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
