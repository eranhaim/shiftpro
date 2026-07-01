import { useState, useEffect } from 'react';
import { Lock, UserPlus, Trash2, ShieldCheck, Users, MessageSquare, Eye, EyeOff } from 'lucide-react';

const API = '/api';

function getAdminHeaders(password) {
  return { 'Content-Type': 'application/json', 'x-admin-password': password };
}

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [managers, setManagers] = useState([]);
  const [chatters, setChatters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('managers');

  // Manager form
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPassword, setMPassword] = useState('');
  const [mCreating, setMCreating] = useState(false);

  // Chatter form
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cCreating, setCCreating] = useState(false);

  const [visiblePasswords, setVisiblePasswords] = useState({});
  const togglePassword = (id) => setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  async function handleUnlock(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API}/admin/verify`, {
        method: 'POST',
        headers: getAdminHeaders(password),
      });
      if (!res.ok) throw new Error();
      setAuthenticated(true);
    } catch {
      setAuthError('סיסמה שגויה');
    }
  }

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [mRes, cRes] = await Promise.all([
        fetch(`${API}/admin/managers`, { headers: getAdminHeaders(password) }),
        fetch(`${API}/admin/chatters`, { headers: getAdminHeaders(password) }),
      ]);
      if (mRes.ok) setManagers(await mRes.json());
      if (cRes.ok) setChatters(await cRes.json());
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function createManager(e) {
    e.preventDefault();
    setMCreating(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/managers`, {
        method: 'POST',
        headers: getAdminHeaders(password),
        body: JSON.stringify({ email: mEmail, password: mPassword, displayName: mName }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setMName(''); setMEmail(''); setMPassword('');
      await loadData();
    } catch (err) { setError(err.message); }
    setMCreating(false);
  }

  async function deleteManager(id, email) {
    if (!window.confirm(`למחוק את המנהל ${email}?`)) return;
    try {
      const res = await fetch(`${API}/admin/managers/${id}`, { method: 'DELETE', headers: getAdminHeaders(password) });
      if (!res.ok) throw new Error((await res.json()).message);
      await loadData();
    } catch (err) { setError(err.message); }
  }

  async function createChatter(e) {
    e.preventDefault();
    setCCreating(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/chatters`, {
        method: 'POST',
        headers: getAdminHeaders(password),
        body: JSON.stringify({ name: cName, email: cEmail, password: cPassword, phone: cPhone }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setCName(''); setCEmail(''); setCPassword(''); setCPhone('');
      await loadData();
    } catch (err) { setError(err.message); }
    setCCreating(false);
  }

  async function deleteChatter(id, name) {
    if (!window.confirm(`למחוק את הצ׳אטר ${name}?`)) return;
    try {
      const res = await fetch(`${API}/admin/chatters/${id}`, { method: 'DELETE', headers: getAdminHeaders(password) });
      if (!res.ok) throw new Error((await res.json()).message);
      await loadData();
    } catch (err) { setError(err.message); }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6" dir="rtl">
        <form onSubmit={handleUnlock} className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm space-y-4">
          <div className="flex items-center justify-center gap-2 text-white mb-2">
            <Lock size={24} />
            <h2 className="text-xl font-bold">פאנל ניהול</h2>
          </div>
          <p className="text-gray-400 text-sm text-center">הזן סיסמת אדמין כדי לגשת</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            autoFocus
          />
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            כניסה
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-blue-400" />
          <h1 className="text-xl font-bold text-white">פאנל ניהול משתמשים</h1>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>}

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-lg p-1">
          <button onClick={() => setTab('managers')} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${tab === 'managers' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <Users size={16} />
            מנהלים ({managers.length})
          </button>
          <button onClick={() => setTab('chatters')} className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${tab === 'chatters' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <MessageSquare size={16} />
            צ׳אטרים ({chatters.length})
          </button>
        </div>

        {/* Managers Tab */}
        {tab === 'managers' && (
          <div className="space-y-4">
            <form onSubmit={createManager} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-medium flex items-center gap-2"><UserPlus size={18} /> הוסף מנהל חדש</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="שם תצוגה" required className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                <input type="email" value={mEmail} onChange={(e) => setMEmail(e.target.value)} placeholder="אימייל" required className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                <input type="password" value={mPassword} onChange={(e) => setMPassword(e.target.value)} placeholder="סיסמה" required className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={mCreating} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {mCreating ? 'יוצר...' : 'צור מנהל'}
              </button>
            </form>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <h3 className="text-white font-medium">מנהלים קיימים</h3>
              </div>
              {loading ? <div className="p-6 text-center text-gray-400">טוען...</div> : (
                <div className="divide-y divide-gray-800">
                  {managers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between px-5 py-3 gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                        <span className="text-white text-sm font-medium">{u.displayName}</span>
                        <span className="text-gray-400 text-sm">{u.email}</span>
                        {u.rawPassword && (
                          <span className="flex items-center gap-1.5">
                            <button onClick={() => togglePassword(u._id)} className="text-gray-500 hover:text-gray-300 transition-colors">
                              {visiblePasswords[u._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <span className="text-xs font-mono text-amber-400">{visiblePasswords[u._id] ? u.rawPassword : '••••••••'}</span>
                          </span>
                        )}
                      </div>
                      <button onClick={() => deleteManager(u._id, u.email)} className="text-gray-400 hover:text-red-400 transition-colors shrink-0" title="מחק">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {managers.length === 0 && <div className="p-6 text-center text-gray-500">אין מנהלים</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chatters Tab */}
        {tab === 'chatters' && (
          <div className="space-y-4">
            <form onSubmit={createChatter} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-medium flex items-center gap-2"><UserPlus size={18} /> הוסף צ׳אטר חדש</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="שם מלא" required className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="אימייל" required className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                <input type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} placeholder="סיסמה" required className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                <input type="tel" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="טלפון (אופציונלי)" className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={cCreating} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {cCreating ? 'יוצר...' : 'צור צ׳אטר'}
              </button>
            </form>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <h3 className="text-white font-medium">צ׳אטרים קיימים</h3>
              </div>
              {loading ? <div className="p-6 text-center text-gray-400">טוען...</div> : (
                <div className="divide-y divide-gray-800">
                  {chatters.map((c) => (
                    <div key={c._id} className="flex items-center justify-between px-5 py-3 gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                        <span className="text-white text-sm font-medium">{c.name}</span>
                        <span className="text-gray-400 text-sm">{c.email || 'ללא אימייל'}</span>
                        {c.phone && <span className="text-gray-500 text-xs">{c.phone}</span>}
                        {c.rawPassword && (
                          <span className="flex items-center gap-1.5">
                            <button onClick={() => togglePassword(c._id)} className="text-gray-500 hover:text-gray-300 transition-colors">
                              {visiblePasswords[c._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <span className="text-xs font-mono text-amber-400">{visiblePasswords[c._id] ? c.rawPassword : '••••••••'}</span>
                          </span>
                        )}
                      </div>
                      <button onClick={() => deleteChatter(c._id, c.name)} className="text-gray-400 hover:text-red-400 transition-colors shrink-0" title="מחק">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {chatters.length === 0 && <div className="p-6 text-center text-gray-500">אין צ׳אטרים</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
