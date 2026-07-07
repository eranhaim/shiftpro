import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPendingShifts, approveShift, rejectShift } from '../../services/api.js';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const DAY_NAMES = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];

function formatShiftDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}`;
}

function formatTime(t) {
  if (!t) return '';
  return t.slice(0, 5);
}

export default function ShiftApproval() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingShifts();
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await approveShift(id);
      setShifts(prev => prev.filter(s => s._id !== id));
      toast.success('המשמרת אושרה');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(id);
      await rejectShift(id, rejectReason);
      setShifts(prev => prev.filter(s => s._id !== id));
      setRejectingId(null);
      setRejectReason('');
      toast.success('המשמרת נדחתה');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const grouped = shifts.reduce((acc, shift) => {
    const name = shift.chatterId?.name || 'לא ידוע';
    if (!acc[name]) acc[name] = [];
    acc[name].push(shift);
    return acc;
  }, {});

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">אישור מנהל</h1>
        <p className="text-gray-400 mt-1 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {shifts.length} משמרות ממתינות לאישור
        </p>
      </div>

      {shifts.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-400">אין משמרות ממתינות לאישור</p>
        </div>
      ) : (
        Object.entries(grouped).map(([chatterName, chatterShifts]) => (
          <div key={chatterName} className="space-y-3">
            <h2 className="text-lg font-bold text-amber-400">{chatterName}</h2>
            {chatterShifts.map(shift => (
              <div key={shift._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-white font-medium">{formatShiftDate(shift.date)}</p>
                    <p className="text-sm text-gray-400">{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(shift._id)}
                      disabled={actionLoading === shift._id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[5rem] whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4" />
                      אשר
                    </button>
                    <button
                      onClick={() => {
                        if (rejectingId === shift._id) {
                          handleReject(shift._id);
                        } else {
                          setRejectingId(shift._id);
                          setRejectReason('');
                        }
                      }}
                      disabled={actionLoading === shift._id}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[5rem] whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      דחה
                    </button>
                  </div>
                </div>

                {rejectingId === shift._id && (
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="סיבת דחייה (אופציונלי)"
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleReject(shift._id);
                        if (e.key === 'Escape') { setRejectingId(null); setRejectReason(''); }
                      }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(shift._id)}
                        className="text-red-400 hover:text-red-300 text-xs font-medium">
                        אשר דחייה
                      </button>
                      <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="text-gray-400 hover:text-gray-300 text-xs">
                        בטל
                      </button>
                    </div>
                  </div>
                )}

                {(shift.assignments || []).length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400">
                          <th className="py-2 px-3 font-medium whitespace-nowrap">מיוצגת</th>
                          <th className="py-2 px-3 font-medium whitespace-nowrap">פלטפורמה</th>
                          <th className="py-2 px-3 font-medium whitespace-nowrap">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shift.assignments.map((a, i) => (
                          <tr key={i} className="border-b border-gray-800/50">
                            <td className="py-2 px-3 text-white whitespace-nowrap">{a.modelName || a.model?.name}</td>
                            <td className="py-2 px-3 text-gray-300 whitespace-nowrap">{a.platform === 'telegram' ? 'טלגרם' : 'אונליפאנס'}</td>
                            <td className="py-2 px-3"><CheckCircle className="w-4 h-4 text-green-500" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
