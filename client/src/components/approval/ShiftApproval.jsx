import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
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
  const dayName = DAY_NAMES[d.getDay()];
  return `${dayName}, ${d.getDate()}.${d.getMonth() + 1}`;
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
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('האם לדחות את המשמרת?')) return;
    try {
      setActionLoading(id);
      await rejectShift(id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const grouped = shifts.reduce((acc, shift) => {
    const name = shift.chatter_name || shift.chatter?.name || 'לא ידוע';
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
            {chatterShifts.map((shift) => (
              <div key={shift.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white font-medium">{formatShiftDate(shift.date)}</p>
                    <p className="text-sm text-gray-400">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(shift.id)}
                      disabled={actionLoading === shift.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      אשר
                    </button>
                    <button
                      onClick={() => handleReject(shift.id)}
                      disabled={actionLoading === shift.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      דחה
                    </button>
                  </div>
                </div>

                {(shift.assignments || []).length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400">
                          <th className="py-2 px-3 font-medium">מיוצגת</th>
                          <th className="py-2 px-3 font-medium">פלטפורמה</th>
                          <th className="py-2 px-3 font-medium">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shift.assignments.map((a, i) => (
                          <tr key={i} className="border-b border-gray-800/50">
                            <td className="py-2 px-3 text-white">{a.model_name || a.model?.name}</td>
                            <td className="py-2 px-3 text-gray-300">{a.platform === 'telegram' ? 'טלגרם' : 'אונליפאנס'}</td>
                            <td className="py-2 px-3">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </td>
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
