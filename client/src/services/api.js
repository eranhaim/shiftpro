const API = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Auth
export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API}/auth/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

// Chatters
export async function getChatters() {
  const res = await fetch(`${API}/chatters`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch chatters');
  return res.json();
}

export async function createChatter(data) {
  const res = await fetch(`${API}/chatters`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create chatter');
  return res.json();
}

export async function updateChatter(id, data) {
  const res = await fetch(`${API}/chatters/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update chatter');
  return res.json();
}

export async function deleteChatter(id) {
  const res = await fetch(`${API}/chatters/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete chatter');
  return res.json();
}

// Models
export async function getModels() {
  const res = await fetch(`${API}/models`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function createModel(data) {
  const res = await fetch(`${API}/models`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create model');
  return res.json();
}

export async function updateModel(id, data) {
  const res = await fetch(`${API}/models/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update model');
  return res.json();
}

export async function deleteModel(id) {
  const res = await fetch(`${API}/models/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete model');
  return res.json();
}

// Shifts
export async function getShifts(weekStart, weekEnd) {
  const params = new URLSearchParams({ weekStart, weekEnd });
  const res = await fetch(`${API}/shifts?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch shifts');
  return res.json();
}

export async function createShift(data) {
  const res = await fetch(`${API}/shifts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create shift');
  return res.json();
}

export async function updateShift(id, data) {
  const res = await fetch(`${API}/shifts/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update shift');
  return res.json();
}

export async function approveShift(id, modelAssignments) {
  const res = await fetch(`${API}/shifts/${id}/approve`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ modelAssignments }),
  });
  if (!res.ok) throw new Error('Failed to approve shift');
  return res.json();
}

export async function rejectShift(id, rejectReason) {
  const res = await fetch(`${API}/shifts/${id}/reject`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ rejectReason }),
  });
  if (!res.ok) throw new Error('Failed to reject shift');
  return res.json();
}

export async function getPendingShifts() {
  const res = await fetch(`${API}/shifts/pending`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch pending shifts');
  return res.json();
}

export async function getAssignmentsForSlot(date, shiftType) {
  const params = new URLSearchParams({ date, shiftType });
  const res = await fetch(`${API}/shifts/assignments-for-slot?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch slot assignments');
  return res.json();
}

export async function updateShiftAssignments(shiftId, modelAssignments) {
  const res = await fetch(`${API}/shifts/${shiftId}/assignments`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ modelAssignments }),
  });
  if (!res.ok) throw new Error('Failed to update shift assignments');
  return res.json();
}

export async function generateWeekShifts(weekStart) {
  const res = await fetch(`${API}/shifts/generate-week`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ weekStart }),
  });
  if (!res.ok) throw new Error('Failed to generate week shifts');
  return res.json();
}

export async function deleteShift(id) {
  const res = await fetch(`${API}/shifts/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete shift');
  return res.json();
}

// Shift Assignments
export async function getShiftAssignments(shiftId) {
  const params = new URLSearchParams({ shiftId });
  const res = await fetch(`${API}/shift-assignments?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch shift assignments');
  return res.json();
}

export async function createShiftAssignment(data) {
  const res = await fetch(`${API}/shift-assignments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create shift assignment');
  return res.json();
}

export async function deleteShiftAssignment(id) {
  const res = await fetch(`${API}/shift-assignments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete shift assignment');
  return res.json();
}

// Daily Summaries
export async function getDailySummaries(params) {
  const query = new URLSearchParams(params);
  const res = await fetch(`${API}/daily-summaries?${query}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch daily summaries');
  return res.json();
}

export async function createDailySummary(data) {
  const res = await fetch(`${API}/daily-summaries`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create daily summary');
  return res.json();
}

export async function updateDailySummary(id, data) {
  const res = await fetch(`${API}/daily-summaries/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update daily summary');
  return res.json();
}

export async function getSummaryDebts() {
  const res = await fetch(`${API}/daily-summaries/debts`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch summary debts');
  return res.json();
}

export async function getIncomeData(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`${API}/daily-summaries/income?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch income data');
  return res.json();
}

// Monthly Goals
export async function getMonthlyGoals(month) {
  const params = new URLSearchParams({ month });
  const res = await fetch(`${API}/monthly-goals?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch monthly goals');
  return res.json();
}

export async function upsertMonthlyGoal(data) {
  const res = await fetch(`${API}/monthly-goals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to upsert monthly goal');
  return res.json();
}

export async function updateMonthlyGoal(id, data) {
  const res = await fetch(`${API}/monthly-goals/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update monthly goal');
  return res.json();
}

export async function copyMonthlyGoals() {
  const res = await fetch(`${API}/monthly-goals/copy`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to copy monthly goals');
  return res.json();
}

// Errors
export async function getErrors(resolved) {
  const params = new URLSearchParams({ resolved });
  const res = await fetch(`${API}/errors?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch errors');
  return res.json();
}

export async function createError(data) {
  const res = await fetch(`${API}/errors`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create error');
  return res.json();
}

export async function resolveError(id) {
  const res = await fetch(`${API}/errors/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to resolve error');
  return res.json();
}

// Users Management
function getAdminHeaders(panelPassword) {
  return {
    ...getHeaders(),
    'x-admin-password': panelPassword,
  };
}

export async function getUsers(panelPassword) {
  const res = await fetch(`${API}/users`, { headers: getAdminHeaders(panelPassword) });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch users');
  return res.json();
}

export async function createUser(data, panelPassword) {
  const res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: getAdminHeaders(panelPassword),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create user');
  return res.json();
}

export async function deleteUser(id, panelPassword) {
  const res = await fetch(`${API}/users/${id}`, {
    method: 'DELETE',
    headers: getAdminHeaders(panelPassword),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete user');
  return res.json();
}

// WhatsApp
export async function getWhatsAppStatus() {
  const res = await fetch(`${API}/whatsapp/status`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
  return res.json();
}

export async function getWhatsAppQR() {
  const res = await fetch(`${API}/whatsapp/qr`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch QR code');
  return res.json();
}

export async function connectWhatsApp() {
  const res = await fetch(`${API}/whatsapp/connect`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to connect WhatsApp');
  return res.json();
}

export async function broadcastWhatsApp(message) {
  const res = await fetch(`${API}/whatsapp/broadcast`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to broadcast message');
  return res.json();
}

export async function disconnectWhatsApp() {
  const res = await fetch(`${API}/whatsapp/disconnect`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to disconnect WhatsApp');
  return res.json();
}

// Analytics
export async function getAnalyticsOverview(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const qs = params.toString();
  const res = await fetch(`${API}/analytics/overview${qs ? '?' + qs : ''}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch analytics overview');
  return res.json();
}

export async function getAnalyticsIncome(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`${API}/analytics/income?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch analytics income');
  return res.json();
}

export async function getAnalyticsShifts(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`${API}/analytics/shifts?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch analytics shifts');
  return res.json();
}
