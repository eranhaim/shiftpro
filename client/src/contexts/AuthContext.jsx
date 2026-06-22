import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from '../services/api';

const API = '/api';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const tryAdmin = getMe()
      .then((data) => {
        const u = data.user ?? data;
        setUser({ ...u, role: u.role || 'admin' });
      })
      .catch(async () => {
        try {
          const res = await fetch(`${API}/chatter-auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setUser({ ...data, role: 'chatter' });
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      });

    tryAdmin.finally(() => setLoading(false));
  }, [token]);

  async function login(email, password) {
    const data = await apiLogin(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser({ ...data.user, role: data.user.role || 'admin' });
  }

  async function chatterLogin(email, password) {
    const res = await fetch(`${API}/chatter-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser({ ...data.user, role: 'chatter' });
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, chatterLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
