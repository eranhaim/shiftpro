import { Router } from "express";
import jwt from "jsonwebtoken";
import Shift from "../models/Shift.js";
import DailySummary from "../models/DailySummary.js";
import ShiftAssignment from "../models/ShiftAssignment.js";
import MonthlyGoal from "../models/MonthlyGoal.js";
import Chatter from "../models/Chatter.js";
import Model from "../models/Model.js";

const router = Router();

async function fetchExchangeRates() {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EUR,ILS",
    );
    if (!res.ok) throw new Error("Frankfurter API error");
    const data = await res.json();
    // data.rates: { EUR: x, ILS: y } — these are "how many EUR/ILS per 1 USD"
    const eurPerUSD = data.rates.EUR;
    const ilsPerUSD = data.rates.ILS;
    return {
      rateEURUSD: 1 / eurPerUSD, // how many USD per 1 EUR
      rateILSUSD: 1 / ilsPerUSD, // how many USD per 1 ILS
    };
  } catch (err) {
    console.error("[Exchange] Failed to fetch rates:", err.message);
    // Fallback rates
    return { rateEURUSD: 1.08, rateILSUSD: 0.027 };
  }
}

function calculateUSD(
  { incomeTelegram, incomeOnlyfans, incomeTransfers, incomeOther },
  { rateEURUSD, rateILSUSD },
) {
  const VAT = 1.18;
  const telegramUSD = Number(incomeTelegram) * rateEURUSD;
  const onlyfansUSD = Number(incomeOnlyfans);
  const transfersUSD = (Number(incomeTransfers) / VAT) * rateILSUSD;
  const otherUSD = (Number(incomeOther) / VAT) * rateILSUSD;
  const totalUSD = telegramUSD + onlyfansUSD + transfersUSD + otherUSD;
  return {
    incomeTelegramUSD: Math.round(telegramUSD * 100) / 100,
    incomeOnlyfansUSD: Math.round(onlyfansUSD * 100) / 100,
    incomeTransfersUSD: Math.round(transfersUSD * 100) / 100,
    incomeOtherUSD: Math.round(otherUSD * 100) / 100,
    incomeTotalUSD: Math.round(totalUSD * 100) / 100,
  };
}

function chatterAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "chatter")
      return res.status(403).json({ message: "Not a chatter" });

    req.chatter = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

router.use(chatterAuth);

// GET /api/chatter-portal/my-shifts — get my shifts
router.get("/my-shifts", async (req, res) => {
  try {
    const shifts = await Shift.find({ chatterId: req.chatter.id })
      .sort({ date: -1 })
      .limit(50);

    const shiftIds = shifts.map((s) => s._id);
    const assignments = await ShiftAssignment.find({
      shiftId: { $in: shiftIds },
    });

    const result = shifts.map((s) => ({
      ...s.toObject(),
      assignments: assignments.filter(
        (a) => a.shiftId.toString() === s._id.toString(),
      ),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/chatter-portal/request-shift — request a new shift
router.post("/request-shift", async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Date, start time, and end time are required" });
    }

    const shift = await Shift.create({
      chatterId: req.chatter.id,
      date: new Date(date),
      startTime,
      endTime,
      status: "pending",
    });

    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/chatter-portal/submit-summary — submit a daily summary
router.post("/submit-summary", async (req, res) => {
  try {
    const b = req.body;
    if (!b.date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const rates = await fetchExchangeRates();
    const usd = calculateUSD(
      {
        incomeTelegram: b.incomeTelegram || 0,
        incomeOnlyfans: b.incomeOnlyfans || 0,
        incomeTransfers: b.incomeTransfers || 0,
        incomeOther: b.incomeOther || 0,
      },
      rates,
    );

    const summary = await DailySummary.create({
      chatterId: req.chatter.id,
      shiftId: b.shiftId || undefined,
      date: new Date(b.date),
      dayOfWeek: b.dayOfWeek,
      shiftType: b.shiftType,
      modelPlatformAssignments: b.modelPlatformAssignments || [],
      availabilityStatus: b.availabilityStatus || "full",
      availabilityGapsDetail: b.availabilityGapsDetail,
      hasDebts: b.hasDebts || false,
      debtsDetail: b.debtsDetail,
      hasPendingSales: b.hasPendingSales || false,
      pendingSalesDetail: b.pendingSalesDetail,
      hasUnusualEvents: b.hasUnusualEvents || false,
      unusualEventsDetail: b.unusualEventsDetail,
      incomeTelegram: Number(b.incomeTelegram) || 0,
      incomeOnlyfans: Number(b.incomeOnlyfans) || 0,
      incomeTransfers: Number(b.incomeTransfers) || 0,
      incomeOther: Number(b.incomeOther) || 0,
      incomeTotal:
        (Number(b.incomeTelegram) || 0) +
        (Number(b.incomeOnlyfans) || 0) +
        (Number(b.incomeTransfers) || 0) +
        (Number(b.incomeOther) || 0),
      ...usd,
      rateEURUSD: rates.rateEURUSD,
      rateILSUSD: rates.rateILSUSD,
      allDepositsVerified: b.allDepositsVerified || false,
      improvementSuggestions: b.improvementSuggestions,
      contentRequest: b.contentRequest,
      selfImprovementPoint: b.selfImprovementPoint,
      selfPreservationPoint: b.selfPreservationPoint,
    });

    res.status(201).json(summary);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/chatter-portal/my-summaries — get my summaries
router.get("/my-summaries", async (req, res) => {
  try {
    const summaries = await DailySummary.find({ chatterId: req.chatter.id })
      .sort({ date: -1 })
      .limit(50);
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/chatter-portal/my-summaries/:id — edit own summary
router.put("/my-summaries/:id", async (req, res) => {
  try {
    const summary = await DailySummary.findOne({ _id: req.params.id, chatterId: req.chatter.id });
    if (!summary) return res.status(404).json({ message: "Summary not found" });
    const allowed = [
      'date','shiftType','availabilityStatus','availabilityGapsDetail',
      'hasDebts','debtsDetail','hasPendingSales','pendingSalesDetail',
      'hasUnusualEvents','unusualEventsDetail','allDepositsVerified',
      'incomeTelegram','incomeOnlyfans','incomeTransfers','incomeOther',
      'improvementSuggestions','contentRequest','selfImprovementPoint','selfPreservationPoint',
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    update.incomeTotal = (Number(update.incomeTelegram ?? summary.incomeTelegram) || 0)
      + (Number(update.incomeOnlyfans ?? summary.incomeOnlyfans) || 0)
      + (Number(update.incomeTransfers ?? summary.incomeTransfers) || 0)
      + (Number(update.incomeOther ?? summary.incomeOther) || 0);
    const updated = await DailySummary.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/chatter-portal/my-summaries/:id — delete own summary
router.delete("/my-summaries/:id", async (req, res) => {
  try {
    const summary = await DailySummary.findOneAndDelete({ _id: req.params.id, chatterId: req.chatter.id });
    if (!summary) return res.status(404).json({ message: "Summary not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/chatter-portal/available-shifts — future scheduled shifts to register for
router.get("/available-shifts", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const myShifts = await Shift.find({
      chatterId: req.chatter.id,
      date: { $gte: today },
      status: { $nin: ["rejected", "cancelled"] },
    }).select("date startTime endTime");

    const registeredKeys = new Set(
      myShifts.map(
        (s) =>
          `${s.date.toISOString().slice(0, 10)}_${s.startTime}_${s.endTime}`,
      ),
    );

    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const slots = [
        { startTime: "12:00", endTime: "19:00", label: "בוקר" },
        { startTime: "19:00", endTime: "02:00", label: "ערב" },
      ];
      const slotsWithStatus = slots.map((sl) => ({
        ...sl,
        date: dateStr,
        registered: registeredKeys.has(
          `${dateStr}_${sl.startTime}_${sl.endTime}`,
        ),
      }));
      days.push({ date: dateStr, slots: slotsWithStatus });
    }

    res.json(days);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/chatter-portal/register-shift — register for a shift slot
router.post("/register-shift", async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "date, startTime, endTime required" });
    }

    const existing = await Shift.findOne({
      chatterId: req.chatter.id,
      date: new Date(date),
      startTime,
      endTime,
      status: { $nin: ["rejected", "cancelled"] },
    });
    if (existing) {
      return res.status(409).json({ message: "כבר נרשמת למשמרת זו" });
    }

    const shift = await Shift.create({
      chatterId: req.chatter.id,
      date: new Date(date),
      startTime,
      endTime,
      status: "pending",
    });

    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/chatter-portal/cancel-shift/:id — cancel own future shift
router.put("/cancel-shift/:id", async (req, res) => {
  try {
    const shift = await Shift.findOne({
      _id: req.params.id,
      chatterId: req.chatter.id,
    });
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    const now = new Date();
    if (shift.date < now && shift.status !== "pending") {
      return res.status(400).json({ message: "Cannot cancel past shifts" });
    }

    shift.status = "cancelled";
    await shift.save();
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/chatter-portal/next-shift — next upcoming approved/scheduled shift
router.get("/next-shift", async (req, res) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const shift = await Shift.findOne({
      chatterId: req.chatter.id,
      date: { $gte: now },
      status: { $in: ["approved", "scheduled"] },
    }).sort({ date: 1 });

    if (!shift) return res.json(null);

    const assignments = await ShiftAssignment.find({ shiftId: shift._id });
    res.json({ ...shift.toObject(), assignments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/chatter-portal/weekly-stats — shifts completed this week
router.get("/weekly-stats", async (req, res) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const count = await Shift.countDocuments({
      chatterId: req.chatter.id,
      date: { $gte: weekStart, $lt: weekEnd },
      status: { $in: ["approved", "completed", "scheduled", "active"] },
    });

    res.json({ weeklyShifts: count });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/chatter-portal/monthly-goal — chatter's monthly goal + progress
router.get("/monthly-goal", async (req, res) => {
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const goal = await MonthlyGoal.findOne({
      chatterId: req.chatter.id,
      month,
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const summaries = await DailySummary.find({
      chatterId: req.chatter.id,
      date: { $gte: monthStart, $lt: monthEnd },
    });

    const totalIncome = summaries.reduce(
      (sum, s) => sum + (s.incomeTotal || 0),
      0,
    );

    res.json({
      goalAmount: goal?.goalAmount || 0,
      currentIncome: totalIncome,
      summaryCount: summaries.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/chatter-portal/schedule — weekly schedule for all chatters
router.get("/schedule", async (req, res) => {
  try {
    const { weekStart } = req.query;
    let start;
    if (weekStart) {
      start = new Date(weekStart);
    } else {
      start = new Date();
      const day = start.getDay();
      start.setDate(start.getDate() - day);
    }
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const shifts = await Shift.find({
      date: { $gte: start, $lt: end },
      status: { $in: ["approved", "scheduled", "active", "completed"] },
    }).populate("chatterId", "name");

    const shiftIds = shifts.map((s) => s._id);
    const assignments = await ShiftAssignment.find({
      shiftId: { $in: shiftIds },
    });

    const result = shifts.map((s) => ({
      ...s.toObject(),
      chatterName: s.chatterId?.name || "—",
      assignments: assignments.filter(
        (a) => a.shiftId.toString() === s._id.toString(),
      ),
    }));

    res.json({ weekStart: start.toISOString(), shifts: result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
