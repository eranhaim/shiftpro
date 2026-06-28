import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { getModels, createModel, updateModel, deleteModel } from '../../services/api.js';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Models() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTelegram, setNewTelegram] = useState(true);
  const [newOnlyfans, setNewOnlyfans] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getModels();
      setModels(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setSubmitting(true);
      const created = await createModel({ name: newName.trim(), telegram: newTelegram, onlyfans: newOnlyfans });
      setModels((prev) => [...prev, created]);
      setNewName('');
      setNewTelegram(true);
      setNewOnlyfans(true);
      setShowAddForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק את המיוצגת?')) return;
    try {
      await deleteModel(id);
      setModels((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTogglePlatform = async (model, platform) => {
    const updated = { ...model, [platform]: !model[platform] };
    try {
      await updateModel(model._id, { [platform]: updated[platform] });
      setModels((prev) => prev.map((m) => m._id === model._id ? { ...m, [platform]: updated[platform] } : m));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (model) => {
    const active = !model.active;
    try {
      await updateModel(model._id, { active });
      setModels((prev) => prev.map((m) => m._id === model._id ? { ...m, active } : m));
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = models.filter((m) => {
    if (search && !m.name.includes(search)) return false;
    if (filterPlatform === 'telegram' && !m.telegram) return false;
    if (filterPlatform === 'onlyfans' && !m.onlyfans) return false;
    return true;
  });

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">מיוצגות</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterPlatform(filterPlatform === 'telegram' ? null : 'telegram')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${filterPlatform === 'telegram' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            טלגרם
          </button>
          <button
            onClick={() => setFilterPlatform(filterPlatform === 'onlyfans' ? null : 'onlyfans')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${filterPlatform === 'onlyfans' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            אונלי
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            הוסף מיוצגת
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="שם המיוצגת"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg pr-9 pl-3 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm w-40"
            />
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap items-end gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="שם המיוצגת"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm flex-1 min-w-[150px]"
            autoFocus
          />
          <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
            <input type="checkbox" checked={newTelegram} onChange={(e) => setNewTelegram(e.target.checked)} className="rounded bg-gray-700 border-gray-600" />
            טלגרם
          </label>
          <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
            <input type="checkbox" checked={newOnlyfans} onChange={(e) => setNewOnlyfans(e.target.checked)} className="rounded bg-gray-700 border-gray-600" />
            אונלי
          </label>
          <button
            onClick={handleAdd}
            disabled={submitting || !newName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'שומר...' : 'שמור'}
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center">
          <p className="text-gray-500">אין מיוצגות{search ? ' תואמות לחיפוש' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((model) => {
            const platforms = [model.telegram && 'טלגרם', model.onlyfans && 'אונלי'].filter(Boolean).join(' + ');
            return (
              <div key={model._id} className={`bg-gray-900 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 ${model.active === false ? 'opacity-50' : ''}`}>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">{model.name}</p>
                  <p className="text-sm text-gray-400 whitespace-nowrap">פלטפורמות: {platforms || 'ללא'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={!!model.telegram}
                      onChange={() => handleTogglePlatform(model, 'telegram')}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    טלגרם
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={!!model.onlyfans}
                      onChange={() => handleTogglePlatform(model, 'onlyfans')}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    אונלי
                  </label>
                  <button
                    onClick={() => handleToggleActive(model)}
                    className="text-gray-400 hover:text-white p-1.5 transition-colors"
                    title={model.active === false ? 'הפעל' : 'השבת'}
                  >
                    {model.active === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(model._id)}
                    className="text-red-500 hover:text-red-400 p-1.5 transition-colors"
                    title="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
