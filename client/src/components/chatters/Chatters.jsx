import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Copy, Check, Eye, EyeOff, Pencil, X, Save, Loader2, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { getChatters, createChatter, updateChatter, deleteChatter, getMonthlyGoals, getMonthlyGoalsProgress, getMonthlyGoalForChatter, upsertMonthlyGoal } from '../../services/api.js';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const TIER_OPTIONS = ['אוטומטי', 'Tier A', 'Tier B', 'Tier C'];

function formatLastLogin(dateStr) {
  if (!dateStr) return 'לא התחבר/ה';
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function EditChatterModal({ chatter, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: chatter.name || '',
    email: chatter.email || '',
    phone: chatter.phone || '',
    password: '',
    active: chatter.active !== false,
    monthlyGoal: '',
  });
  const [goalId, setGoalId] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMonthlyGoalForChatter(chatter._id, getCurrentMonth())
      .then((goal) => {
        if (goal) {
          setGoalId(goal._id);
          setForm((f) => ({ ...f, monthlyGoal: goal.goalAmount ?? '' }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingGoal(false));
  }, [chatter._id]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('שם הוא שדה חובה');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        active: form.active,
      };
      if (form.password.trim()) {
        payload.password = form.password;
      }
      const [updated] = await Promise.all([
        updateChatter(chatter._id, payload),
        form.monthlyGoal !== ''
          ? upsertMonthlyGoal({ chatterId: chatter._id, month: getCurrentMonth(), goalAmount: Number(form.monthlyGoal) })
          : Promise.resolve(),
      ]);
      toast.success('הצ׳אטר עודכן בהצלחה');
      onSaved(updated);
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון הצ׳אטר');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4" onMouseDown={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col overflow-hidden"
        dir="rtl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-400" />
            עריכת צ׳אטר
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">שם</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">אימייל</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">טלפון</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">סיסמה</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="השאר ריק אם לא רוצה לשנות"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
              <Target className="w-4 h-4 text-yellow-400" />
              יעד חודשי (₪) — {new Date().toLocaleString('he-IL', { month: 'long', year: 'numeric' })}
            </label>
            {loadingGoal ? (
              <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-gray-500 text-sm">טוען...</span>
              </div>
            ) : (
              <input
                type="number"
                min="0"
                value={form.monthlyGoal}
                onChange={(e) => setForm({ ...form, monthlyGoal: e.target.value })}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm transition-colors"
              />
            )}
          </div>

          <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <span className="text-sm font-medium text-gray-300">סטטוס פעיל</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.active ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.active ? 'translate-x-1.5' : 'translate-x-6'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-800 shrink-0 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'שומר...' : 'שמור'}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ chatterName, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm overflow-hidden"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">האם אתה בטוח?</h3>
            <p className="text-gray-400 text-sm mt-1">
              הצ׳אטר <span className="text-white font-medium">{chatterName}</span> יימחק לצמיתות
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? 'מוחק...' : 'מחק'}
            </button>
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Chatters() {
  const [chatters, setChatters] = useState([]);
  const [goalsProgress, setGoalsProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [editingChatter, setEditingChatter] = useState(null);
  const [deletingChatter, setDeletingChatter] = useState(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentMonth = getCurrentMonth();
      const [data, progress] = await Promise.all([
        getChatters(),
        getMonthlyGoalsProgress(currentMonth).catch(() => []),
      ]);
      setChatters(Array.isArray(data) ? data : []);
      const progressMap = {};
      (Array.isArray(progress) ? progress : []).forEach((g) => {
        if (g.chatterId) progressMap[g.chatterId] = { earned: g.earned, goalAmount: g.goalAmount };
      });
      setGoalsProgress(progressMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setSubmitting(true);
      const newChatter = await createChatter(form);
      setChatters((prev) => [...prev, newChatter]);
      setForm({ name: '', phone: '', email: '', password: '' });
      toast.success('צ׳אטר נוצר בהצלחה');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingChatter) return;
    try {
      await deleteChatter(deletingChatter._id);
      setChatters((prev) => prev.filter((c) => c._id !== deletingChatter._id));
      toast.success('הצ׳אטר נמחק בהצלחה');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingChatter(null);
    }
  };

  const handleEditSaved = (updated) => {
    setChatters((prev) => prev.map((c) => c._id === updated._id ? updated : c));
    setEditingChatter(null);
    // רענן יעדים חודשיים
    getMonthlyGoalsProgress(getCurrentMonth()).then((progress) => {
      const progressMap = {};
      (Array.isArray(progress) ? progress : []).forEach((g) => {
        if (g.chatterId) progressMap[g.chatterId] = { earned: g.earned, goalAmount: g.goalAmount };
      });
      setGoalsProgress(progressMap);
    }).catch(() => {});
  };

  const handleTierChange = async (id, tier) => {
    try {
      await updateChatter(id, { tier });
      setChatters((prev) => prev.map((c) => c._id === id ? { ...c, tier } : c));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyLink = (chatter) => {
    const link = chatter.token ? `${window.location.origin}/chatter/${chatter.token}` : `${window.location.origin}/chatter/${chatter._id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(chatter._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">צ׳אטרים</h1>
        <p className="text-gray-400 text-sm mt-1">ניהול צ׳אטרים ולינקים אישיים</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <input
            type="text"
            placeholder="שם"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-1 min-w-[120px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            type="text"
            placeholder="טלפון"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="flex-1 min-w-[120px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            type="email"
            placeholder="אימייל"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="flex-1 min-w-[120px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="flex-1 min-w-[120px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            הוסף צ׳אטר/ית
          </button>
        </div>
      </form>

      <div className="bg-gray-900 rounded-xl overflow-hidden">
        {chatters.length === 0 ? (
          <p className="text-gray-500 text-center py-12">אין צ׳אטרים</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium whitespace-nowrap">שם</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">טלפון</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סיסמה</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">כניסה אחרונה לאפליקציה</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">יעד חודשי</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">TIER</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">לינק אישי</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {chatters.map((c) => (
                  <tr key={c._id} className={`border-b border-gray-800 hover:bg-gray-800/30 ${c.active === false ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4 text-white font-medium whitespace-nowrap">
                      {c.name}
                      {c.active === false && (
                        <span className="mr-2 text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">לא פעיל</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-300 whitespace-nowrap">{c.phone || '—'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {c.rawPassword ? (
                        <span className="flex items-center gap-1.5">
                          <button onClick={() => setVisiblePasswords(p => ({ ...p, [c._id]: !p[c._id] }))}
                            className="text-gray-500 hover:text-gray-300 transition-colors">
                            {visiblePasswords[c._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <span className="text-xs font-mono text-amber-400">
                            {visiblePasswords[c._id] ? c.rawPassword : '••••••••'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm whitespace-nowrap">{formatLastLogin(c.lastSignInAt)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {(() => {
                        const p = goalsProgress[c._id];
                        if (!p) return <span className="text-gray-600 text-sm">—</span>;
                        const earned = p.earned || 0;
                        const goal = p.goalAmount;
                        const pct = goal > 0 ? Math.min(Math.round((earned / goal) * 100), 100) : null;
                        return (
                          <span className="text-sm font-medium">
                            <span className={pct != null && pct >= 100 ? 'text-green-400' : 'text-white'}>
                              ₪{earned.toLocaleString()}
                            </span>
                            {goal != null && (
                              <span className="text-gray-500">
                                {' / '}₪{goal.toLocaleString()}
                              </span>
                            )}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={c.tier || 'אוטומטי'}
                        onChange={(e) => handleTierChange(c._id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500 min-w-[100px]"
                      >
                        {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => copyLink(c)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        {copiedId === c._id ? <Check className="w-3 h-3 text-green-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                        {copiedId === c._id ? 'הועתק!' : 'העתק קישור'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingChatter(c)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-400/10 transition-colors"
                          title="ערוך"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingChatter(c)}
                          className="text-red-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingChatter && (
        <EditChatterModal
          chatter={editingChatter}
          onClose={() => setEditingChatter(null)}
          onSaved={handleEditSaved}
        />
      )}

      {deletingChatter && (
        <DeleteConfirmModal
          chatterName={deletingChatter.name}
          onConfirm={handleDelete}
          onClose={() => setDeletingChatter(null)}
        />
      )}
    </div>
  );
}
