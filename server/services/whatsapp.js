const BASE_URL = 'https://api.green-api.com';

function getConfig() {
  const instanceId = process.env.GREENAPI_INSTANCE_ID;
  const apiToken = process.env.GREENAPI_API_TOKEN;
  if (!instanceId || !apiToken) {
    return null;
  }
  return { instanceId, apiToken };
}

function apiUrl(method) {
  const cfg = getConfig();
  if (!cfg) throw new Error('GreenAPI not configured — set GREENAPI_INSTANCE_ID and GREENAPI_API_TOKEN');
  return `${BASE_URL}/waInstance${cfg.instanceId}/${method}/${cfg.apiToken}`;
}

function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\(\)\.+]/g, '');
  if (cleaned.startsWith('0')) cleaned = '972' + cleaned.slice(1);
  if (!cleaned.match(/^\d{10,15}$/)) return null;
  return cleaned;
}

export function isConfigured() {
  return getConfig() !== null;
}

export async function checkInstance() {
  const url = apiUrl('getStateInstance');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GreenAPI error: ${res.status}`);
  return res.json();
}

export async function sendMessage(phone, message) {
  const chatId = normalizePhone(phone);
  if (!chatId) throw new Error(`Invalid phone number: ${phone}`);

  const url = apiUrl('sendMessage');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: `${chatId}@c.us`,
      message,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GreenAPI sendMessage failed (${res.status}): ${body}`);
  }

  return res.json();
}

export async function broadcastMessage(phones, message) {
  const results = [];
  for (const phone of phones) {
    try {
      const result = await sendMessage(phone, message);
      results.push({ phone, success: true, id: result.idMessage });
    } catch (err) {
      results.push({ phone, success: false, error: err.message });
    }
    // GreenAPI rate limit: small delay between messages
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

export function buildShiftReminderMessage(chatterName, date, startTime, endTime) {
  return `שלום ${chatterName} 👋\n\nתזכורת: יש לך משמרת ב-${date}\nשעות: ${startTime} - ${endTime}\n\nShiftPro`;
}

export function buildDailySummaryReminderMessage(chatterName) {
  return `שלום ${chatterName} 👋\n\nנא למלא סיכום יומי עבור המשמרת של היום.\n\nShiftPro`;
}

export function buildCustomMessage(chatterName, text) {
  return `שלום ${chatterName} 👋\n\n${text}\n\nShiftPro`;
}

export function buildReportMessage(title, lines) {
  return `📊 ${title}\n\n${lines.join('\n')}\n\nShiftPro`;
}
