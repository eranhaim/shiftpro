import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { getErrors, resolveError } from '../../services/api.js';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Errors() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOpen, setShowOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getErrors(!showOpen);
      setErrors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }, [showOpen]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleResolve = async (id) => {
    try {
      await resolveError(id);
      setErrors((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">שגיאות</h1>
          <p className="text-gray-400 text-sm mt-1">לוג שגיאות מהמערכת</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOpen(!showOpen)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${showOpen ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            <Filter className="w-4 h-4" />
            שגיאות פתוחות
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            רענן
          </button>
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-16 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl text-gray-300 font-medium">אין שגיאות</p>
          <p className="text-gray-500 text-sm mt-1">המערכת פועלת תקין</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((err) => (
            <div key={err._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{err.message}</p>
                    {err.source && <p className="text-sm text-gray-400 mt-1">מקור: {err.source}</p>}
                    <p className="text-xs text-gray-500 mt-1">{formatTimestamp(err.createdAt || err.timestamp)}</p>
                  </div>
                </div>
                {!err.resolved && (
                  <button
                    onClick={() => handleResolve(err._id)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap"
                  >
                    סמן כפתור
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
