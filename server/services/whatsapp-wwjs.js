import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_PATH = path.join(__dirname, '..', '.wwebjs_auth');

function clearStaleLocks() {
  const sessionDir = path.join(AUTH_PATH, 'session');
  if (!fs.existsSync(sessionDir)) return;
  for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
    const fp = path.join(sessionDir, f);
    try { fs.unlinkSync(fp); } catch {}
  }
}

let client = null;
let connected = false;
let phoneInfo = null;
let latestQR = null;
let latestQRDataURL = null;
let initializing = false;

function createClient() {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: AUTH_PATH,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--disable-dbus',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    },
  });

  client.on('qr', async (qr) => {
    console.log('[WhatsApp] QR code received');
    latestQR = qr;
    try {
      latestQRDataURL = await QRCode.toDataURL(qr, { width: 300 });
    } catch (err) {
      console.error('[WhatsApp] Failed to generate QR data URL:', err.message);
    }
  });

  client.on('ready', () => {
    console.log('[WhatsApp] Client is ready');
    connected = true;
    latestQR = null;
    latestQRDataURL = null;
    const info = client.info;
    phoneInfo = info?.wid?.user || null;
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Authenticated successfully');
  });

  client.on('disconnected', (reason) => {
    console.log('[WhatsApp] Disconnected:', reason);
    connected = false;
    phoneInfo = null;
    initializing = false;
  });

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Auth failure:', msg);
    connected = false;
    initializing = false;
  });

  return client;
}

export function getStatus() {
  return { connected, phone: phoneInfo };
}

export function getQR() {
  if (connected) return { qr: null, message: 'Already connected' };
  if (!latestQRDataURL) return { qr: null, message: 'No QR code available. Call /connect first.' };
  return { qr: latestQRDataURL };
}

export async function connect() {
  if (connected) return { message: 'Already connected' };
  if (initializing) return { message: 'Connection already in progress, scan the QR code' };

  initializing = true;
  latestQR = null;
  latestQRDataURL = null;

  clearStaleLocks();
  if (!client) createClient();

  client.initialize().catch((err) => {
    console.error('[WhatsApp] Initialize error:', err.message);
    initializing = false;
  });

  return { message: 'Initializing... QR code will appear shortly' };
}

function formatPhone(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '972' + digits.slice(1);
  if (!digits.includes('@')) digits += '@c.us';
  return digits;
}

export async function sendMessage(phone, message) {
  if (!connected || !client) throw new Error('WhatsApp is not connected');
  const chatId = formatPhone(phone);
  await client.sendMessage(chatId, message);
  return { success: true, phone };
}

export async function broadcast(phones, message) {
  if (!connected || !client) throw new Error('WhatsApp is not connected');

  const results = [];
  for (const phone of phones) {
    try {
      const chatId = formatPhone(phone);
      await client.sendMessage(chatId, message);
      results.push({ phone, status: 'sent' });
    } catch (err) {
      results.push({ phone, status: 'failed', error: err.message });
    }
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  return { sent, total: phones.length, results };
}

export async function disconnect() {
  if (!client) return { message: 'No active session' };

  try {
    await client.logout();
  } catch {
    // ignore logout errors
  }

  try {
    await client.destroy();
  } catch {
    // ignore destroy errors
  }

  client = null;
  connected = false;
  phoneInfo = null;
  latestQR = null;
  latestQRDataURL = null;
  initializing = false;

  return { message: 'Disconnected and session destroyed' };
}
