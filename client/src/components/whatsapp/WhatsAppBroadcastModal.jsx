import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getWhatsAppStatus,
  getWhatsAppQR,
  connectWhatsApp,
  broadcastWhatsApp,
  disconnectWhatsApp,
} from '../../services/api.js';

export default function WhatsAppBroadcastModal({ onClose }) {
  const [connected, setConnected] = useState(false);
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrImage, setQrImage] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const qrPollRef = useRef(null);

  useEffect(() => {
    checkStatus();
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  async function checkStatus() {
    try {
      const data = await getWhatsAppStatus();
      setConnected(data.connected);
      setPhone(data.phone);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    setQrImage(null);
    try {
      await connectWhatsApp();
      startQrPolling();
    } catch (err) {
      toast.error(err.message);
      setConnecting(false);
    }
  }

  function startQrPolling() {
    if (qrPollRef.current) clearInterval(qrPollRef.current);
    qrPollRef.current = setInterval(async () => {
      try {
        const statusData = await getWhatsAppStatus();
        if (statusData.connected) {
          clearInterval(qrPollRef.current);
          qrPollRef.current = null;
          setConnected(true);
          setPhone(statusData.phone);
          setConnecting(false);
          setQrImage(null);
          toast.success('WhatsApp מחובר בהצלחה!');
          return;
        }
        const qrData = await getWhatsAppQR();
        if (qrData.qr) {
          setQrImage(qrData.qr);
        }
      } catch {
        // keep polling
      }
    }, 3000);
  }

  async function handleBroadcast() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const data = await broadcastWhatsApp(message.trim());
      toast.success(`נשלחו ${data.sent}/${data.total} הודעות בהצלחה`);
      setMessage('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('להתנתק מ-WhatsApp?')) return;
    setDisconnecting(true);
    try {
      await disconnectWhatsApp();
      setConnected(false);
      setPhone(null);
      toast.success('WhatsApp מנותק');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">שליחת הודעה לצ׳אטרים</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : !connected ? (
            /* Not Connected View */
            <div className="space-y-5 text-center">
              {!connecting && !qrImage && (
                <>
                  <div className="flex justify-center">
                    <WifiOff size={40} className="text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-sm">יש להתחבר ל-WhatsApp כדי לשלוח הודעות</p>
                  <button
                    onClick={handleConnect}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-medium transition-colors"
                  >
                    התחבר ל-WhatsApp
                  </button>
                </>
              )}

              {(connecting || qrImage) && (
                <div className="space-y-4">
                  {qrImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={qrImage}
                        alt="WhatsApp QR Code"
                        className="w-56 h-56 rounded-lg bg-white p-2"
                      />
                      <p className="text-gray-400 text-sm">
                        סרוק את קוד ה-QR עם WhatsApp בטלפון שלך
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <Loader2 size={32} className="animate-spin text-green-500" />
                      <p className="text-gray-400 text-sm">ממתין לקוד QR...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Connected View */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">מחובר</span>
                {phone && <span className="text-gray-500 text-xs mr-auto" dir="ltr">{phone}</span>}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="הקלד הודעה לכל הצ׳אטרים..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 resize-none placeholder-gray-500"
                rows={4}
              />

              <button
                onClick={handleBroadcast}
                disabled={sending || !message.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {sending ? 'שולח...' : 'שלח לכולם'}
              </button>

              <div className="pt-2 border-t border-gray-800">
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-red-400 hover:text-red-300 text-xs transition-colors disabled:opacity-50"
                >
                  {disconnecting ? 'מתנתק...' : 'התנתק מ-WhatsApp'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
