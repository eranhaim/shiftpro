import { useState, useEffect } from 'react';
import { Lock, UserPlus, Trash2, ShieldCheck } from 'lucide-react';
import { getUsers, createUser, deleteUser } from '../../services/api';

export default function Users() {
  const [panelPassword, setPanelPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [creating, setCreating] = useState(false);

  async function handleUnlock(e) {
    e.preventDefault();
    setAuthError('');
    try {
      await getUsers(panelPassword);
      setAuthenticated(true);
    } catch {
      setAuthError('סיסמה שגויה');
    }
  }

  useEffect(() => {
    if (!authenticated) return;
    loadUsers();
  }, [authenticated]);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers(panelPassword);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await createUser(
        { email: newEmail, password: newPassword, displayName: newName, role: newRole },
        panelPassword,
      );
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('admin');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id, email) {
    if (!window.confirm(`למחוק את המשתמש ${email}?`)) return;
    try {
      await deleteUser(id, panelPassword);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-full flex items-center justify-center p-6" dir="rtl">
        <form onSubmit={handleUnlock} className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm space-y-4">
          <div className="flex items-center justify-center gap-2 text-white mb-2">
            <Lock size={24} />
            <h2 className="text-xl font-bold">ניהול משתמשים</h2>
          </div>
          <p className="text-gray-400 text-sm text-center">הזן סיסמת אדמין כדי לגשת</p>
          <input
            type="password"
            value={panelPassword}
            onChange={(e) => setPanelPassword(e.target.value)}
            placeholder="סיסמת אדמין"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            autoFocus
          />
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            כניסה
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <ShieldCheck size={24} className="text-blue-400" />
        <h1 className="text-xl font-bold text-white">ניהול משתמשים</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <UserPlus size={18} />
          הוסף משתמש חדש
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="שם תצוגה"
            required
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="אימייל"
            required
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="סיסמה"
            required
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="admin">אדמין</option>
            <option value="manager">מנהל</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {creating ? 'יוצר...' : 'צור משתמש'}
        </button>
      </form>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-white font-medium">משתמשים קיימים ({users.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">טוען...</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {users.map((u) => (
              <div key={u._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-white text-sm font-medium">{u.displayName}</span>
                  <span className="text-gray-400 text-sm mr-3">{u.email}</span>
                  <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded mr-2">
                    {u.role === 'admin' ? 'אדמין' : 'מנהל'}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(u._id, u.email)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  title="מחק משתמש"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
