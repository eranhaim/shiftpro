import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { login, chatterLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('admin'); // 'admin' or 'chatter'

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'admin') {
        await login(email, password);
      } else {
        await chatterLogin(email, password);
      }
    } catch (err) {
      setError(err.message || 'שגיאה בהתחברות');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">ShiftPro</h1>
            <p className="text-gray-400 mt-2">מערכת ניהול משמרות</p>
          </div>

          {/* Toggle admin / chatter */}
          <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('admin')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              מנהל
            </button>
            <button
              type="button"
              onClick={() => setMode('chatter')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'chatter' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              צ׳אטר
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="אימייל"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>מתחבר...</span>
                </>
              ) : (
                'כניסה'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
