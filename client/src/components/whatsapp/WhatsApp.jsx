import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Users, Bell, FileText, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const API = '/api';
function hdr() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function WhatsApp() {
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [tab, setTab] = useState('broadcast');

  const [chatters, setChatters] = useState([]);
  const [selectedChatters, setSelectedChatters] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const [singlePhone, setSinglePhone] = useState('');
  const [singleMessage, setSingleMessage] = useState('');

  const checkStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const r = await fetch(`${API}/whatsapp/status`, { headers: hdr() });
      if (r.ok) setStatus(await r.json());
    } catch { /* ignore */ }
    setStatusLoading(false);
  }, []);

  const loadChatters = useCallback(async () => {
    try {
      const r = await fetch(`${API}/chatters`, { headers: hdr() });
      if (r.ok) setChatters(await r.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { checkStatus(); loadChatters(); }, [checkStatus, loadChatters]);

  const toggleChatter = (id) => {
    setSelectedChatters(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const withPhone = chatters.filter(c => c.phone);
    if (selectedChatters.length === withPhone.length) {
      setSelectedChatters([]);
    } else {
      setSelectedChatters(withPhone.map(c => c._id));
    }
  };

  async function handleBroadcast() {
    if (!message.trim()) return toast.error('נא להזין הודעה');
    setSending(true);
    setResults(null);
    try {
      const body = { message: message.trim() };
      if (selectedChatters.length > 0 && selectedChatters.length < chatters.filter(c => c.phone).length) {
        body.chatterIds = selectedChatters;
      }
      const r = await fetch(`${API}/whatsapp/broadcast`, { method: 'POST', headers: hdr(), body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setResults(data);
      toast.success(`נשלחו ${data.sent}/${data.total} הודעות`);
      setMessage('');
    } catch (err) {
      toast.error(err.message);
    }
    setSending(false);
  }

  async function handleSendSingle() {
    if (!singlePhone.trim() || !singleMessage.trim()) return toast.error('נא למלא טלפון והודעה');
    setSending(true);
    try {
      const r = await fetch(`${API}/whatsapp/send`, {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({ phone: singlePhone.trim(), message: singleMessage.trim() }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.message);
      toast.success('ההודעה נשלחה');
      setSingleMessage('');
    } catch (err) {
      toast.error(err.message);
    }
    setSending(false);
  }

  async function handleQuickAction(endpoint, label) {
    setSending(true);
    setResults(null);
    try {
      const r = await fetch(`${API}/whatsapp/${endpoint}`, { method: 'POST', headers: hdr() });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setResults(data);
      toast.success(`${label}: ${data.sent}/${data.total}`);
    } catch (err) {
      toast.error(err.message);
    }
    setSending(false);
  }

  const notConfigured = status && !status.configured;
  const isConnected = status?.state?.stateInstance === 'authorized';
  const chattersWithPhone = chatters.filter(c => c.phone);

  const tabs = [
    { id: 'broadcast', label: 'שליחה לכולם', icon: Users },
    { id: 'single', label: 'הודעה בודדת', icon: Send },
    { id: 'quick', label: 'פעולות מהירות', icon: Bell },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
          {statusLoading ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : notConfigured ? (
            <span className="bg-yellow-900/60 text-yellow-400 text-xs px-2.5 py-1 rounded-full">לא מוגדר</span>
          ) : isConnected ? (
            <span className="bg-green-900/60 text-green-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> מחובר
            </span>
          ) : (
            <span className="bg-red-900/60 text-red-400 text-xs px-2.5 py-1 rounded-full">מנותק</span>
          )}
        </div>
        <button onClick={checkStatus} disabled={statusLoading}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {notConfigured && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-4 text-sm text-yellow-400">
          <p className="font-medium mb-1">GreenAPI לא מוגדר</p>
          <p className="text-yellow-500">
            הגדר את GREENAPI_INSTANCE_ID ו-GREENAPI_API_TOKEN בקובץ .env של השרת כדי להפעיל שליחת הודעות WhatsApp.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setResults(null); }}
            className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${
              tab === t.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-300'
            }`}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ BROADCAST TAB ══════════ */}
      {tab === 'broadcast' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">בחר צ׳אטרים</h3>
              <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300">
                {selectedChatters.length === chattersWithPhone.length ? 'בטל הכל' : 'בחר הכל'}
              </button>
            </div>
            {chattersWithPhone.length === 0 ? (
              <p className="text-gray-500 text-sm">אין צ׳אטרים עם מספר טלפון</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {chattersWithPhone.map(c => (
                  <label key={c._id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      selectedChatters.includes(c._id) ? 'bg-blue-900/30 text-blue-300 border border-blue-800/50' : 'bg-gray-800/50 text-gray-400 border border-transparent hover:bg-gray-800'
                    }`}>
                    <input type="checkbox" checked={selectedChatters.includes(c._id)} onChange={() => toggleChatter(c._id)}
                      className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500" />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              {selectedChatters.length === 0 ? `ישלח ל-${chattersWithPhone.length} צ׳אטרים (כולם)` : `נבחרו ${selectedChatters.length} צ׳אטרים`}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <label className="text-sm font-medium text-white block">תוכן ההודעה</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="כתוב את ההודעה כאן... (ההודעה תפתח ב׳שלום {שם הצ׳אטר}׳ אוטומטית)"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
              rows={4}
            />
            <button onClick={handleBroadcast} disabled={sending || !message.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
              {sending ? 'שולח...' : 'שלח לכולם'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ SINGLE MESSAGE TAB ══════════ */}
      {tab === 'single' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-white block mb-1">מספר טלפון</label>
            <input type="tel" value={singlePhone} onChange={e => setSinglePhone(e.target.value)}
              placeholder="050-1234567"
              dir="ltr"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-white block mb-1">הודעה</label>
            <textarea value={singleMessage} onChange={e => setSingleMessage(e.target.value)}
              placeholder="תוכן ההודעה..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
              rows={3} />
          </div>
          <button onClick={handleSendSingle} disabled={sending || !singlePhone.trim() || !singleMessage.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'שולח...' : 'שלח הודעה'}
          </button>
        </div>
      )}

      {/* ══════════ QUICK ACTIONS TAB ══════════ */}
      {tab === 'quick' && (
        <div className="space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-medium text-sm">תזכורות משמרות מחר</h3>
              <p className="text-gray-500 text-xs mt-1">שלח תזכורת לכל מי שיש לו משמרת מחר</p>
            </div>
            <button onClick={() => handleQuickAction('shift-reminders', 'תזכורות משמרות')} disabled={sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
              שלח
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-medium text-sm">תזכורת סיכום יומי</h3>
              <p className="text-gray-500 text-xs mt-1">הזכר לצ׳אטרים שלא שלחו סיכום יומי היום</p>
            </div>
            <button onClick={() => handleQuickAction('summary-reminders', 'תזכורות סיכום')} disabled={sending}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              שלח
            </button>
          </div>
        </div>
      )}

      {/* ══════════ RESULTS ══════════ */}
      {results && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-white">
            תוצאות: {results.sent}/{results.total} נשלחו בהצלחה
          </h3>
          {(results.results || []).length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {results.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {r.success ? (
                    <CheckCircle size={14} className="text-green-400 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  )}
                  <span className="text-gray-300">{r.name || r.phone}</span>
                  {!r.success && <span className="text-red-400 truncate">{r.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
