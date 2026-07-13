import { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronLeft, Download, Plus, Check } from "lucide-react";
import {
  getShifts,
  generateWeekShifts,
  getModels,
} from "../../services/api.js";
import ShiftApprovalModal from "../approval/ShiftApprovalModal.jsx";
import CreateShiftModal from "./CreateShiftModal.jsx";
import exportShiftsExcel from "../../utils/exportShiftsExcel.js";

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const SHIFT_TYPES = [
  { key: "morning", label: "בוקר 12:00-19:00", start: "12:00", end: "19:00" },
  { key: "evening", label: "ערב 19:00-02:00", start: "19:00", end: "02:00" },
];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayDate(date) {
  return `${date.getDate()}.${date.getMonth() + 1}`;
}

function formatDateRange(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${formatDayDate(start)} - ${formatDayDate(end)}`;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getStatusBadge(status) {
  const map = {
    planned: { label: "מתוכנן", cls: "bg-gray-700 text-gray-300" },
    approved: { label: "מאושר", cls: "bg-green-900 text-green-400" },
    pending: { label: "ממתין", cls: "bg-yellow-900 text-yellow-400" },
    rejected: { label: "נדחה", cls: "bg-red-900 text-red-400" },
  };
  const s = map[status] || map.planned;
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full inline-block whitespace-nowrap ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ShiftSchedule() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [shifts, setShifts] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [createSlot, setCreateSlot] = useState(null);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      const [shiftsData, modelsData] = await Promise.all([
        getShifts(toISODate(weekStart), toISODate(end)),
        getModels(),
      ]);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      setModels(Array.isArray(modelsData) ? modelsData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateWeek = (dir) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const goToCurrentWeek = () => setWeekStart(getWeekStart(new Date()));

  const handleExport = () => {
    exportShiftsExcel(weekStart, shifts);
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const nextWeek = new Date(weekStart);
      nextWeek.setDate(nextWeek.getDate() + 7);
      await generateWeekShifts(toISODate(nextWeek));
      navigateWeek(1);
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getShiftsForDayType = (date, type) => {
    const dateStr = toISODate(date);
    return shifts.filter((s) => {
      const shiftDate = s.date?.split("T")[0] || s.date;
      const isMatchDate = shiftDate === dateStr;
      const isMatchType =
        type === "morning"
          ? s.shiftType === "morning" || s.startTime === "12:00"
          : s.shiftType === "evening" || s.startTime === "19:00";
      return isMatchDate && isMatchType;
    });
  };

  const selectedDayShifts = selectedDay
    ? shifts.filter(
        (s) => (s.date?.split("T")[0] || s.date) === toISODate(selectedDay),
      )
    : [];

  const coveredModels = new Set();
  selectedDayShifts.forEach((s) => {
    (s.assignments || []).forEach((a) => coveredModels.add(a.modelId));
  });

  if (loading) return <Spinner />;
  if (error)
    return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">לוח משמרות</h1>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4 shrink-0" />
          ייצוא משמרות
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => navigateWeek(-1)}
          className="text-gray-400 hover:text-white p-1"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={goToCurrentWeek}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          השבוע
        </button>
        <span className="text-gray-300 font-medium">
          {formatDateRange(weekStart)}
        </span>
        <button
          onClick={() => navigateWeek(1)}
          className="text-gray-400 hover:text-white p-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl">
        <div className="min-w-[1020px]">
          {/* שורת ימים */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`w-full text-center p-2 rounded-lg transition-colors ${
                  selectedDay && toISODate(selectedDay) === toISODate(day)
                    ? "bg-blue-600/20 border-b-2 border-blue-500"
                    : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                <p className="text-white font-medium text-sm">
                  {DAY_NAMES[idx]}
                </p>
                <p className="text-gray-400 text-xs">{formatDayDate(day)}</p>
              </button>
            ))}
          </div>

          {/* שורה לכל סוג משמרת */}
          {SHIFT_TYPES.map((type) => (
            <div key={type.key} className="mt-2 mb-2">
              {/* כותרת בלוק */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                <div className="col-span-6 bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-center">
                  <span className="text-sm font-semibold text-gray-300">
                    {type.label}
                  </span>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-4" />
              </div>
              {/* תאי המשמרות */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                  const dayShifts = getShiftsForDayType(day, type.key);
                  return (
                    <div
                      key={idx}
                      className="bg-gray-900 border border-gray-800 p-2 rounded-lg min-h-[100px] cursor-pointer hover:border-gray-600 transition-colors flex flex-col justify-start"
                      onClick={() =>
                        setCreateSlot({
                          date: toISODate(day),
                          shiftType: type.key,
                        })
                      }
                    >
                      {dayShifts.length === 0 ? (
                        <p className="text-xs text-gray-600 text-center mt-4">
                          —
                        </p>
                      ) : (
                        <>
                          {dayShifts.map((shift) => {
                            const isPending = shift.status === "pending";
                            const isOverloaded = (shift.assignments || []).length >= 3;
                            return (
                              <div
                                key={shift._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedShift(shift);
                                }}
                                className={`rounded-lg p-2 mb-1 overflow-hidden cursor-pointer transition-colors ${
                                  isOverloaded
                                    ? "bg-red-900/20 border-2 border-red-500/60 hover:border-red-400"
                                    : isPending
                                    ? "bg-yellow-900/20 border-2 border-yellow-500/60 hover:border-yellow-400"
                                    : "bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-750"
                                }`}
                              >
                                <p className={`text-sm font-bold truncate ${isOverloaded ? "text-red-400" : "text-white"}`}>
                                  {shift.chatterId?.name || "צ׳אטר"}
                                </p>
                                <div className="mt-1">
                                  {getStatusBadge(shift.status)}
                                </div>
                                {(shift.assignments || []).map((a, ai) => (
                                  <p key={ai} className="text-xs text-gray-400 mt-1 truncate">
                                    {a.modelName || a.model?.name} -{" "}
                                    {a.platform === "telegram" ? "טלגרם" : "אונליפאנס"}
                                  </p>
                                ))}
                              </div>
                            );
                          })}
                          {/* מיוצגות לא מכוסות */}
                          {(() => {
                            const coveredKeys = new Set(
                              dayShifts.flatMap((s) =>
                                (s.assignments || []).map((a) => `${a.modelId}:${a.platform}`)
                              )
                            );
                            const uncoveredEntries = [];
                            models.forEach((m) => {
                              if (m.platforms?.telegram && !coveredKeys.has(`${m._id}:telegram`))
                                uncoveredEntries.push({ name: m.name, platform: 'טלגרם', id: `${m._id}:telegram` });
                              if (m.platforms?.onlyfans && !coveredKeys.has(`${m._id}:onlyfans`))
                                uncoveredEntries.push({ name: m.name, platform: 'אונלי', id: `${m._id}:onlyfans` });
                            });
                            if (uncoveredEntries.length === 0) return null;
                            return (
                              <div className="mt-auto pt-2 border-t border-gray-800">
                                <p className="text-xs text-orange-400 font-semibold mb-1">לא מיוצגות</p>
                                {uncoveredEntries.map((e) => (
                                  <p key={e.id} className="text-xs text-orange-400/70 truncate leading-loose">
                                    {e.name} - {e.platform}
                                  </p>
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div className="bg-gray-900 rounded-xl p-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-white truncate min-w-0">
              כיסוי מיוצגות — {DAY_NAMES[selectedDay.getDay()]}{" "}
              {formatDayDate(selectedDay)}
            </h2>
            <span className="text-sm text-gray-400 whitespace-nowrap shrink-0">
              {coveredModels.size}/{models.length} שיבוצים מלאים
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-max">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="py-2 px-4 font-medium whitespace-nowrap">
                    מיוצגת
                  </th>
                  <th className="py-2 px-4 font-medium text-center whitespace-nowrap">
                    טלגרם
                  </th>
                  <th className="py-2 px-4 font-medium text-center whitespace-nowrap">
                    אונליפאנס
                  </th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => {
                  const assignments = selectedDayShifts.flatMap((s) =>
                    (s.assignments || []).filter(
                      (a) => a.modelId === model._id,
                    ),
                  );
                  const hasTelegram = assignments.some(
                    (a) => a.platform === "telegram",
                  );
                  const hasOnlyfans = assignments.some(
                    (a) => a.platform === "onlyfans",
                  );
                  return (
                    <tr key={model._id} className="border-b border-gray-800">
                      <td className="py-2 px-4 text-white whitespace-nowrap">
                        {model.name}
                      </td>
                      <td className="py-2 px-4 text-center whitespace-nowrap">
                        {hasTelegram ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-center whitespace-nowrap">
                        {hasOnlyfans ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedShift && (
        <ShiftApprovalModal
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          onApproved={() => {
            setSelectedShift(null);
            fetchData();
          }}
          onRejected={() => {
            setSelectedShift(null);
            fetchData();
          }}
          onSaved={() => {
            setSelectedShift(null);
            fetchData();
          }}
          onDeleted={() => {
            setSelectedShift(null);
            fetchData();
          }}
        />
      )}

      {createSlot && (
        <CreateShiftModal
          date={createSlot.date}
          shiftType={createSlot.shiftType}
          onClose={() => setCreateSlot(null)}
          onCreated={() => {
            setCreateSlot(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
