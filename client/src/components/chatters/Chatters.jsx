import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Copy, Check } from 'lucide-react';
import { getChatters, createChatter, updateChatter, deleteChatter } from '../../services/api.js';

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

export default function Chatters() {
  const [chatters, setChatters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getChatters();
      setChatters(Array.isArray(data) ? data : []);
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
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק את הצ׳אטר?')) return;
    try {
      await deleteChatter(id);
      setChatters((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTierChange = async (id, tier) => {
    try {
      await updateChatter(id, { tier });
      setChatters((prev) => prev.map((c) => c._id === id ? { ...c, tier } : c));
    } catch (err) {
      alert(err.message);
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
                  <th className="py-3 px-4 font-medium">שם</th>
                  <th className="py-3 px-4 font-medium">טלפון</th>
                  <th className="py-3 px-4 font-medium">כניסה אחרונה לאפליקציה</th>
                  <th className="py-3 px-4 font-medium">TIER</th>
                  <th className="py-3 px-4 font-medium">לינק אישי</th>
                  <th className="py-3 px-4 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {chatters.map((c) => (
                  <tr key={c._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-gray-300">{c.phone || '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{formatLastLogin(c.lastSignInAt)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={c.tier || 'אוטומטי'}
                        onChange={(e) => handleTierChange(c._id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => copyLink(c)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                      >
                        {copiedId === c._id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        {copiedId === c._id ? 'הועתק!' : 'העתק קישור'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="text-red-500 hover:text-red-400 p-1 transition-colors"
                        title="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
