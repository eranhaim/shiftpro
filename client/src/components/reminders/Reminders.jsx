import { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Check, Trash2, Clock, RefreshCw } from 'lucide-react';

const API = '/api';
function hdr() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, '0')}.${(dt.getMonth() + 1).toString().padStart(2, '0')}.${dt.getFullYear()}`;
}

const TYPE_LABELS = {
  general: 'כללי',
  shift: 'משמרת',
  summary: 'סיכום',
  payment: 'תשלום',
};

const TYPE_COLORS = {
  general: 'bg-gray-700 text-gray-300',
  shift: 'bg-blue-900/60 text-blue-400',
  summary: 'bg-purple-900/60 text-purple-400',
  payment: 'bg-green-900/60 text-green-400',
};

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [newMsg, setNewMsg] = useState('');
  const [newType, setNewType] = useState('general');
  const [newDue, setNewDue] = useState('');
  const [creating, setCreating] = useState(false);

  const [chatters, setChatters] = useState([]);
  const [newChatterId, setNewChatterId] = useState('');

  const loadReminders = useCallback(async () => {
    try {
      const r = await fetch(`${API}/reminders?completed=${showCompleted}`, { headers: hdr() });
      if (r.ok) setReminders(await r.json());
    } catch { /* ignore */ }
  }, [showCompleted]);

  const loadChatters = useCallback(async () => {
    try {
      const r = await fetch(`${API}/chatters`, { headers: hdr() });
      if (r.ok) setChatters(await r.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadReminders(), loadChatters()]).finally(() => setLoading(false));
  }, [loadReminders, loadChatters]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setCreating(true);
    try {
      const body = { message: newMsg, type: newType };
      if (newDue) body.dueDate = newDue;
      if (newChatterId) body.chatterId = newChatterId;
      const r = await fetch(`${API}/reminders`, { method: 'POST', headers: hdr(), body: JSON.stringify(body) });
      if (r.ok) {
        setNewMsg('');
        setNewType('general');
        setNewDue('');
        setNewChatterId('');
        setShowForm(false);
        await loadReminders();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function toggleComplete(id, completed) {
    try {
      await fetch(`${API}/reminders/${id}`, {
        method: 'PUT', headers: hdr(), body: JSON.stringify({ completed: !completed }),
      });
      await loadReminders();
    } catch { /* ignore */ }
  }

  async function deleteReminder(id) {
    if (!confirm('למחוק תזכורת?')) return;
    try {
      await fetch(`${API}/reminders/${id}`, { method: 'DELETE', headers: hdr() });
      await loadReminders();
    } catch { /* ignore */ }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-6 p-4 lg:p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">תזכורות</h1>
          <span className="bg-blue-900/60 text-blue-400 text-xs px-2.5 py-1 rounded-full">
            {reminders.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus size={16} />
            תזכורת חדשה
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => setShowCompleted(false)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${!showCompleted ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
          פתוחות
        </button>
        <button onClick={() => setShowCompleted(true)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${showCompleted ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
          הושלמו
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">הודעה</label>
            <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="תוכן התזכורת..."
              className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">סוג</label>
              <select value={newType} onChange={e => setNewType(e.target.value)} className={inputCls}>
                <option value="general">כללי</option>
                <option value="shift">משמרת</option>
                <option value="summary">סיכום</option>
                <option value="payment">תשלום</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">תאריך יעד</label>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">צ׳אטר (אופציונלי)</label>
              <select value={newChatterId} onChange={e => setNewChatterId(e.target.value)} className={inputCls}>
                <option value="">— כללי —</option>
                {chatters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={creating}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                {creating ? 'יוצר...' : 'צור'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">טוען...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{showCompleted ? 'אין תזכורות שהושלמו' : 'אין תזכורות פתוחות'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map(r => {
            const overdue = r.dueDate && !r.completed && new Date(r.dueDate) < new Date();
            return (
              <div key={r._id} className={`bg-gray-900 border rounded-lg p-4 flex items-start gap-3 ${overdue ? 'border-red-800/50' : 'border-gray-800'}`}>
                <button onClick={() => toggleComplete(r._id, r.completed)}
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    r.completed ? 'bg-green-600 border-green-600' : 'border-gray-600 hover:border-blue-500'
                  }`}>
                  {r.completed && <Check size={12} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${r.completed ? 'text-gray-500 line-through' : 'text-white'}`}>{r.message}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[r.type] || TYPE_COLORS.general}`}>
                      {TYPE_LABELS[r.type] || r.type}
                    </span>
                    {r.chatterId?.name && (
                      <span className="text-[10px] text-gray-500">{r.chatterId.name}</span>
                    )}
                    {r.dueDate && (
                      <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                        <Clock size={10} /> {fmtDate(r.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteReminder(r._id)}
                  className="shrink-0 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
