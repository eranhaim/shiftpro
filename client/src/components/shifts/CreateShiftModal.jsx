import { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, Loader2, AlertTriangle, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getChatters, getModels, getAssignmentsForSlot, createShift, updateShiftAssignments } from '../../services/api.js';

const SHIFT_CONFIG = {
  morning: { label: 'בוקר (12:00–19:00)', startTime: '12:00', endTime: '19:00' },
  evening: { label: 'ערב (19:00–02:00)', startTime: '19:00', endTime: '02:00' },
};

const DAY_NAMES = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export default function CreateShiftModal({ date, shiftType, onClose, onCreated }) {
  const [chatters, setChatters] = useState([]);
  const [models, setModels] = useState([]);
  const [takenKeys, setTakenKeys] = useState(new Set());
  const [selectedChatterId, setSelectedChatterId] = useState('');
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [chatterSearch, setChatterSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const config = SHIFT_CONFIG[shiftType] || SHIFT_CONFIG.morning;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const slotType = shiftType === 'evening' ? 'night' : 'morning';
        const [chattersData, modelsData, slotAssignments] = await Promise.all([
          getChatters(),
          getModels(),
          getAssignmentsForSlot(date, slotType).catch(() => []),
        ]);
        if (cancelled) return;
        setChatters(Array.isArray(chattersData) ? chattersData : []);
        setModels(Array.isArray(modelsData) ? modelsData : []);

        const taken = new Set(
          (Array.isArray(slotAssignments) ? slotAssignments : [])
            .map((a) => `${a.modelId}:${a.platform}`)
        );
        setTakenKeys(taken);
      } catch {
        toast.error('שגיאה בטעינת נתונים');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [date, shiftType]);

  const filteredChatters = useMemo(() => {
    if (!chatterSearch.trim()) return chatters;
    const q = chatterSearch.trim().toLowerCase();
    return chatters.filter((c) => c.name?.toLowerCase().includes(q));
  }, [chatters, chatterSearch]);

  const selectedChatterName = useMemo(() => {
    const c = chatters.find((ch) => ch._id === selectedChatterId);
    return c?.name || '';
  }, [chatters, selectedChatterId]);

  function togglePlatform(modelId, platform) {
    const key = `${modelId}:${platform}`;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit() {
    if (!selectedChatterId) {
      toast.error('יש לבחור צ׳אטר');
      return;
    }
    setSubmitting(true);
    try {
      const shiftData = {
        chatterId: selectedChatterId,
        date,
        startTime: config.startTime,
        endTime: config.endTime,
        status: 'approved',
      };
      const newShift = await createShift(shiftData);

      if (selectedKeys.size > 0) {
        const modelAssignments = [...selectedKeys].map((key) => {
          const [modelId, platform] = key.split(':');
          const model = models.find((m) => m._id === modelId);
          return { modelId, modelName: model?.name || '', platform };
        });
        await updateShiftAssignments(newShift._id, modelAssignments);
      }

      toast.success('המשמרת נוצרה בהצלחה');
      onCreated?.();
    } catch (err) {
      toast.error(err.message || 'שגיאה ביצירת המשמרת');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-400" />
            יצירת משמרת
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Slot info */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-1">
            <p className="text-sm text-gray-300">{formatDate(date)}</p>
            <p className="text-sm text-gray-400">{config.label}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Chatter selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">בחר צ׳אטר</h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm text-right flex items-center justify-between focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <span className={selectedChatterId ? 'text-white' : 'text-gray-500'}>
                      {selectedChatterName || 'בחר צ׳אטר...'}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                      <div className="p-2 border-b border-gray-700">
                        <div className="relative">
                          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={chatterSearch}
                            onChange={(e) => setChatterSearch(e.target.value)}
                            placeholder="חפש צ׳אטר..."
                            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pr-8 pl-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredChatters.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-3">לא נמצאו צ׳אטרים</p>
                        ) : (
                          filteredChatters.map((c) => (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => {
                                setSelectedChatterId(c._id);
                                setDropdownOpen(false);
                                setChatterSearch('');
                              }}
                              className={`w-full text-right px-3 py-2 text-sm transition-colors ${
                                selectedChatterId === c._id
                                  ? 'bg-blue-600/20 text-blue-300'
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Model selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">בחר מודלים לשיבוץ</h3>
                {models.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">אין מודלים במערכת</p>
                ) : (
                  <div className="space-y-2">
                    {models.map((model) => {
                      const platformEntries = [
                        model.platforms?.telegram && { key: 'telegram', label: 'טלגרם' },
                        model.platforms?.onlyfans && { key: 'onlyfans', label: 'אונלי' },
                      ].filter(Boolean);

                      if (platformEntries.length === 0) return null;

                      const anySelected = platformEntries.some((p) => selectedKeys.has(`${model._id}:${p.key}`));

                      return (
                        <div
                          key={model._id}
                          className={`rounded-xl px-4 py-3 transition-all ${
                            anySelected
                              ? 'bg-blue-600/10 border border-blue-500/40'
                              : 'bg-gray-800/50 border border-gray-700/50'
                          }`}
                        >
                          <span className="text-sm font-medium text-white">{model.name}</span>
                          <div className="flex items-center gap-3 mt-2">
                            {platformEntries.map(({ key, label }) => {
                              const comboKey = `${model._id}:${key}`;
                              const isTaken = takenKeys.has(comboKey);
                              const isChecked = selectedKeys.has(comboKey);

                              return (
                                <button
                                  key={key}
                                  type="button"
                                  disabled={isTaken}
                                  onClick={() => togglePlatform(model._id, key)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    isTaken
                                      ? 'bg-gray-800/60 text-gray-600 cursor-not-allowed'
                                      : isChecked
                                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                                        : 'bg-gray-700/50 text-gray-400 border border-gray-600/50 hover:border-gray-500'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    isTaken
                                      ? 'border-gray-700 bg-gray-800'
                                      : isChecked
                                        ? 'border-blue-500 bg-blue-600'
                                        : 'border-gray-500'
                                  }`}>
                                    {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
                                    {isTaken && <X className="w-2.5 h-2.5 text-gray-600" />}
                                  </div>
                                  <span>{label}</span>
                                  {isTaken && (
                                    <span className="flex items-center gap-0.5 text-yellow-500/70">
                                      <AlertTriangle className="w-3 h-3" />
                                      תפוס
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting || loading || !selectedChatterId}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? 'יוצר משמרת...' : 'צור משמרת'}
          </button>
        </div>
      </div>
    </div>
  );
}
