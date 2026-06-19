import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from './models/User.js';
import Chatter from './models/Chatter.js';
import Model from './models/Model.js';
import Shift from './models/Shift.js';
import ShiftAssignment from './models/ShiftAssignment.js';
import DailySummary from './models/DailySummary.js';
import MonthlyGoal from './models/MonthlyGoal.js';
import ErrorLog from './models/ErrorLog.js';
import ActivityLog from './models/ActivityLog.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSunday(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function seed() {
  await Promise.all([
    User.deleteMany({}), Chatter.deleteMany({}), Model.deleteMany({}),
    Shift.deleteMany({}), ShiftAssignment.deleteMany({}), DailySummary.deleteMany({}),
    MonthlyGoal.deleteMany({}), ErrorLog.deleteMany({}), ActivityLog.deleteMany({}),
  ]);

  const hashedPassword = await bcrypt.hash('elite665', 10);
  await User.create({
    email: 'gil@onlyelite.co.il',
    password: hashedPassword,
    displayName: 'Gil',
    role: 'admin',
  });

  const chatterData = [
    { name: 'איזי צ\'אט', phone: '5510000000' },
    { name: 'איתי טופור', phone: '+972586823060' },
    { name: 'איתמר', phone: '+972507166154' },
    { name: 'אלעד', phone: '+972584995588' },
    { name: 'אלעזר', phone: '+972515643363' },
    { name: 'גיא קנפו', phone: '+972548803220' },
    { name: 'הכשרה 4.0', phone: '524693807' },
    { name: 'זיו', phone: '+972533082181' },
    { name: 'יובל', phone: '+972527998120' },
    { name: 'יורי', phone: '+972547953866' },
    { name: 'עידן חומי', phone: '+972507100590' },
    { name: 'עידן לזר', phone: '+972548341874' },
    { name: 'עמית', phone: '+972523104994' },
    { name: 'פלג', phone: '+972508270043' },
    { name: 'רון', phone: '+972558867250' },
    { name: 'תומר', phone: '+972523515282' },
    { name: 'תומר אגסי', phone: '+972558856009' },
  ];

  const tiers = ['A', 'B', 'C', null];
  const tierMap = {
    'עמית': 'A', 'איתמר': 'B', 'יורי': 'B', 'גיא קנפו': 'B', 'תומר': 'B', 'זיו': 'B',
    'איתי טופור': 'C', 'אלעד': 'C', 'אלעזר': 'C', 'עידן חומי': 'C', 'עידן לזר': 'C',
    'יובל': 'C', 'תומר אגסי': 'C', 'פלג': 'C', 'רון': 'C', 'הכשרה 4.0': 'C',
  };

  const chatters = await Chatter.insertMany(
    chatterData.map(c => ({
      ...c,
      email: `${c.name.replace(/[^a-zA-Z\u0590-\u05FF0-9]/g, '')}@shiftpro.local`,
      token: crypto.randomBytes(16).toString('hex'),
      active: true,
      bonusTier: tierMap[c.name] || pick(tiers),
    }))
  );

  const modelNames = ['אדל', 'בר', 'בר סימן טוב', 'דינה', 'הודיה', 'ירדן', 'מילאן', 'קארן', 'רומי', 'תמר'];
  const models = await Model.insertMany(
    modelNames.map(name => ({ name, active: true, platforms: { telegram: true, onlyfans: true } }))
  );

  const weekStart = getSunday(new Date());
  const shifts = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + day);
    for (const chatter of chatters) {
      shifts.push({ chatterId: chatter._id, date, startTime: '12:00', endTime: '19:00', status: 'scheduled' });
      shifts.push({ chatterId: chatter._id, date, startTime: '19:00', endTime: '02:00', status: 'scheduled' });
    }
  }

  // Mark some shifts as pending for the approval page
  const pendingIndices = new Set();
  while (pendingIndices.size < 12) pendingIndices.add(rand(0, shifts.length - 1));
  for (const idx of pendingIndices) shifts[idx].status = 'pending';

  const createdShifts = await Shift.insertMany(shifts);

  const platformOptions = ['telegram', 'onlyfans'];
  const assignments = [];
  for (const shift of createdShifts) {
    const count = rand(2, 3);
    const used = new Set();
    for (let i = 0; i < count; i++) {
      let model;
      do { model = pick(models); } while (used.has(model._id.toString()));
      used.add(model._id.toString());
      assignments.push({
        shiftId: shift._id, modelId: model._id, modelName: model.name,
        platform: pick(platformOptions), shiftDate: shift.date, shiftStartTime: shift.startTime,
      });
    }
  }
  await ShiftAssignment.insertMany(assignments);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const goalAmounts = {
    'איתמר': 100000, 'איתי טופור': 20000, 'אלעד': 50000, 'אלעזר': 65000,
    'גיא קנפו': 20000, 'זיו': 60000, 'יובל': 40000, 'יורי': 35000,
    'עידן חומי': 35000, 'עידן לזר': 50000, 'עמית': 110000, 'תומר': 50000, 'תומר אגסי': 50000,
  };
  await MonthlyGoal.insertMany(
    chatters.map(c => ({ chatterId: c._id, month: currentMonth, goalAmount: goalAmounts[c.name] || 0 }))
  );

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const pastShifts = createdShifts.filter(s => s.date < new Date());
  const sampled = pastShifts.slice(0, Math.min(pastShifts.length, 50));
  const summaries = sampled.map(shift => {
    const tg = rand(50, 2000);
    const of = rand(100, 1500);
    const tr = rand(0, 500);
    return {
      chatterId: shift.chatterId, shiftId: shift._id, date: shift.date,
      dayOfWeek: dayNames[shift.date.getDay()],
      shiftType: shift.startTime === '12:00' ? 'בוקר' : 'ערב',
      modelPlatformAssignments: [
        { modelName: pick(modelNames), platforms: ['telegram'] },
        { modelName: pick(modelNames), platforms: ['onlyfans'] },
      ],
      availabilityStatus: pick(['full', 'full', 'full', 'partial']),
      incomeTelegram: tg, incomeOnlyfans: of, incomeTransfers: tr,
      incomeTotal: tg + of + tr, allDepositsVerified: Math.random() > 0.3,
    };
  });
  if (summaries.length > 0) await DailySummary.insertMany(summaries);

  console.log(`Seeded: 1 admin, ${chatters.length} chatters, ${models.length} models, ${createdShifts.length} shifts, ${assignments.length} assignments, ${summaries.length} summaries`);
}
