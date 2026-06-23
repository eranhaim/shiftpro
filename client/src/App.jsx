import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import ChatterPortal from './components/chatter-portal/ChatterPortal';
import AdminPanel from './components/admin/AdminPanel';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return <Login />;

  if (user.role === 'chatter') return <ChatterPortal />;

  return <Layout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
}
