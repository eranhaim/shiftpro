import cron from 'node-cron';
import Shift from '../models/Shift.js';
import Chatter from '../models/Chatter.js';

const WHATSAPP_SERVICE = 'http://localhost:4001';

function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getShiftType(startTime) {
  const hour = parseInt(startTime.split(':')[0], 10);
  return hour < 15 ? 'בוקר' : 'ערב';
}

async function sendWhatsApp(phone, message) {
  const res = await fetch(`${WHATSAPP_SERVICE}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function checkAndSendReminders() {
  try {
    const now = new Date();
    const from = new Date(now.getTime() + 25 * 60 * 1000);
    const to = new Date(now.getTime() + 35 * 60 * 1000);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const shifts = await Shift.find({
      status: { $in: ['approved', 'scheduled'] },
      reminded: { $ne: true },
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate('chatterId');

    for (const shift of shifts) {
      const [hours, minutes] = shift.startTime.split(':').map(Number);
      const shiftStart = new Date(shift.date);
      shiftStart.setHours(hours, minutes, 0, 0);

      if (shiftStart < from || shiftStart > to) continue;

      const chatter = shift.chatterId;
      if (!chatter || !chatter.phone) continue;

      const shiftType = getShiftType(shift.startTime);
      const dateStr = formatDate(shift.date);
      const message = `היי ${chatter.name}! תזכורת: המשמרת שלך מתחילה בעוד 30 דקות (${shiftType} ${dateStr}). בהצלחה! 🎯`;

      try {
        await sendWhatsApp(chatter.phone, message);
        shift.reminded = true;
        await shift.save();
        console.log(`[shift-reminder] Sent reminder to ${chatter.name} (${chatter.phone}) for shift at ${shift.startTime}`);
      } catch (err) {
        console.error(`[shift-reminder] Failed to send to ${chatter.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[shift-reminder] Error checking shifts:', err.message);
  }
}

export function startShiftReminder() {
  cron.schedule('*/5 * * * *', checkAndSendReminders);
  console.log('[shift-reminder] Scheduler started — checking every 5 minutes');
}
