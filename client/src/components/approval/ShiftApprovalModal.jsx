import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader2, User, Calendar, Clock, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getModels, getAssignmentsForSlot, approveShift, rejectShift, updateShiftAssignments } from '../../services/api.js';

const DAY_NAMES = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];

function formatShiftDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function getShiftType(startTime) {
  return startTime === '12:00' ? 'morning' : 'night';
}

function getShiftLabel(startTime) {
  return startTime === '12:00' ? 'בוקר (12:00–19:00)' : 'לילה (19:00–02:00)';
}

export default function ShiftApprovalModal({ shift, onClose, onApproved, onRejected, onSaved }) {
  const isEditMode = shift.status !== 'pending';

  const [models, setModels] = useState([]);
  const [takenKeys, setTakenKeys] = useState(new Set());
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const shiftDate = shift.date?.split('T')[0] || shift.date;
  const shiftType = getShiftType(shift.startTime);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [modelsData, slotAssignments] = await Promise.all([
          getModels(),
          getAssignmentsForSlot(shiftDate, shiftType).catch(() => []),
        ]);
        if (cancelled) return;
        setModels(Array.isArray(modelsData) ? modelsData : []);

        const ownAssignmentKeys = new Set(
          (shift.assignments || []).map((a) => `${a.modelId}:${a.platform}`)
        );

        const taken = new Set(
          (Array.isArray(slotAssignments) ? slotAssignments : [])
            .filter((a) => !ownAssignmentKeys.has(`${a.modelId}:${a.platform}`))
            .map((a) => `${a.modelId}:${a.platform}`)
        );
        setTakenKeys(taken);

        if (isEditMode) {
          setSelectedKeys(new Set(ownAssignmentKeys));
        }
      } catch {
        toast.error('שגיאה בטעינת מיוצגות');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [shiftDate, shiftType, isEditMode]);

  function togglePlatform(modelId, platform) {
    const key = `${modelId}:${platform}`;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleApprove() {
    setApproving(true);
    try {
      const modelAssignments = [...selectedKeys].map((key) => {
        const [modelId, platform] = key.split(':');
        const model = models.find((m) => m._id === modelId);
        return { modelId, modelName: model?.name || '', platform };
      });

      await approveShift(shift._id, modelAssignments);
      toast.success('המשמרת אושרה בהצלחה');
      onApproved?.(shift._id);
    } catch (err) {
      toast.error(err.message || 'שגיאה באישור המשמרת');
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      await rejectShift(shift._id, rejectReason);
      toast.success('המשמרת נדחתה');
      onRejected?.(shift._id);
    } catch (err) {
      toast.error(err.message || 'שגיאה בדחיית המשמרת');
    } finally {
      setRejecting(false);
    }
  }

  async function handleSaveChanges() {
    setSaving(true);
    try {
      const modelAssignments = [...selectedKeys].map((key) => {
        const [modelId, platform] = key.split(':');
        const model = models.find((m) => m._id === modelId);
        return { modelId, modelName: model?.name || '', platform };
      });

      await updateShiftAssignments(shift._id, modelAssignments);
      toast.success('השיבוצים עודכנו בהצלחה');
      onSaved?.(shift._id);
    } catch (err) {
      toast.error(err.message || 'שגיאה בעדכון השיבוצים');
    } finally {
      setSaving(false);
    }
  }

  const chatterName = shift.chatterId?.name || 'צ׳אטר לא ידוע';
  const isBusy = approving || rejecting || saving;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-lg font-bold text-white">
            {isEditMode ? 'עריכת שיבוצים' : 'אישור משמרת'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Shift info */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-white">
              <User className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-medium">{chatterName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <span>{formatShiftDate(shift.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Clock className="w-4 h-4 text-gray-500 shrink-0" />
              <span>{getShiftLabel(shift.startTime)}</span>
            </div>
          </div>

          {/* Model selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">בחר מודלים לשיבוץ</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : models.length === 0 ? (
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

          {/* Reject reason input — only in approve mode */}
          {!isEditMode && showRejectInput && (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="סיבת דחייה (אופציונלי)"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleReject();
                  if (e.key === 'Escape') { setShowRejectInput(false); setRejectReason(''); }
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-800 shrink-0">
          {isEditMode ? (
            <button
              onClick={handleSaveChanges}
              disabled={saving || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'שומר...' : `שמור שינויים${selectedKeys.size > 0 ? ` (${selectedKeys.size} שיבוצים)` : ''}`}
            </button>
          ) : (
            <>
              <button
                onClick={handleApprove}
                disabled={isBusy || loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {approving ? 'מאשר...' : `אשר משמרת${selectedKeys.size > 0 ? ` (${selectedKeys.size} שיבוצים)` : ''}`}
              </button>
              <button
                onClick={() => {
                  if (showRejectInput) {
                    handleReject();
                  } else {
                    setShowRejectInput(true);
                  }
                }}
                disabled={isBusy}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 disabled:opacity-50 text-red-400 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {rejecting ? 'דוחה...' : 'דחה'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
