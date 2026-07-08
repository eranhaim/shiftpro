import { Router } from 'express';
import DailySummary from '../models/DailySummary.js';
import Shift from '../models/Shift.js';
import auth from '../middleware/auth.js';

async function fetchExchangeRates() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,ILS');
    if (!res.ok) throw new Error('Frankfurter API error');
    const data = await res.json();
    return {
      rateEURUSD: 1 / data.rates.EUR,
      rateILSUSD: 1 / data.rates.ILS,
    };
  } catch (err) {
    console.error('[Exchange] Failed to fetch rates:', err.message);
    return { rateEURUSD: 1.08, rateILSUSD: 0.027 };
  }
}

function calculateUSD({ incomeTelegram, incomeOnlyfans, incomeTransfers, incomeOther }, { rateEURUSD, rateILSUSD }) {
  const VAT = 1.18;
  const telegramUSD  = Number(incomeTelegram)  * rateEURUSD;
  const onlyfansUSD  = Number(incomeOnlyfans);
  const transfersUSD = (Number(incomeTransfers) / VAT) * rateILSUSD;
  const otherUSD     = (Number(incomeOther)     / VAT) * rateILSUSD;
  const totalUSD     = telegramUSD + onlyfansUSD + transfersUSD + otherUSD;
  return {
    incomeTelegramUSD:  Math.round(telegramUSD  * 100) / 100,
    incomeOnlyfansUSD:  Math.round(onlyfansUSD  * 100) / 100,
    incomeTransfersUSD: Math.round(transfersUSD * 100) / 100,
    incomeOtherUSD:     Math.round(otherUSD     * 100) / 100,
    incomeTotalUSD:     Math.round(totalUSD     * 100) / 100,
  };
}

const router = Router();
router.use(auth);

// GET /api/daily-summaries/debts  (before /:id)
router.get('/debts', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastShifts = await Shift.find({ date: { $lt: today } })
      .populate('chatterId', 'name')
      .sort({ date: -1 });

    const summaryShiftIds = new Set(
      (await DailySummary.find({ shiftId: { $ne: null } }).select('shiftId'))
        .map((s) => s.shiftId.toString()),
    );

    const debts = pastShifts.filter((s) => !summaryShiftIds.has(s._id.toString()));
    res.json(debts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/daily-summaries/income
router.get('/income', async (req, res) => {
  try {
    const match = {};
    if (req.query.startDate || req.query.endDate) {
      match.date = {};
      if (req.query.startDate) match.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) match.date.$lte = new Date(req.query.endDate);
    }

    const result = await DailySummary.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$chatterId',
          totalIncome: { $sum: '$incomeTotal' },
          totalTelegram: { $sum: '$incomeTelegram' },
          totalOnlyfans: { $sum: '$incomeOnlyfans' },
          totalTransfers: { $sum: '$incomeTransfers' },
          totalOther: { $sum: '$incomeOther' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'chatters',
          localField: '_id',
          foreignField: '_id',
          as: 'chatter',
        },
      },
      { $unwind: '$chatter' },
      {
        $project: {
          chatterId: '$_id',
          chatterName: '$chatter.name',
          totalIncome: 1,
          totalTelegram: 1,
          totalOnlyfans: 1,
          totalTransfers: 1,
          totalOther: 1,
          count: 1,
        },
      },
      { $sort: { totalIncome: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/daily-summaries
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    let query = DailySummary.find(filter)
      .populate('chatterId', 'name')
      .sort({ date: -1 });

    if (req.query.limit) query = query.limit(parseInt(req.query.limit));

    const summaries = await query;
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/daily-summaries
router.post('/', async (req, res) => {
  try {
    const rates = await fetchExchangeRates();
    const usd = calculateUSD(req.body, rates);
    const summary = await DailySummary.create({ ...req.body, ...usd, rateEURUSD: rates.rateEURUSD, rateILSUSD: rates.rateILSUSD });
    res.status(201).json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/daily-summaries/:id
router.put('/:id', async (req, res) => {
  try {
    const rates = await fetchExchangeRates();
    const usd = calculateUSD(req.body, rates);
    const summary = await DailySummary.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...usd, rateEURUSD: rates.rateEURUSD, rateILSUSD: rates.rateILSUSD },
      { new: true, runValidators: true }
    );
    if (!summary) return res.status(404).json({ message: 'Summary not found' });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
