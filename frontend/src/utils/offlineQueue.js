// Simple localStorage-backed offline sales queue with online sync.
import api from '../services/api.js';

const KEY = 'offline_sales_queue';

export const getQueue = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const setQueue = (q) => localStorage.setItem(KEY, JSON.stringify(q));

export const enqueueSale = (sale) => {
  const q = getQueue();
  q.push({ ...sale, offlineId: sale.offlineId || `off-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
  setQueue(q);
  return q.length;
};

export const syncQueue = async () => {
  const q = getQueue();
  if (!q.length) return { synced: 0 };
  const { data } = await api.post('/sales/sync', { sales: q });
  // Keep only failed ones
  const failedIds = (data.data || []).filter((r) => r.status === 'failed').map((r) => r.offlineId);
  setQueue(q.filter((s) => failedIds.includes(s.offlineId)));
  return { synced: q.length - failedIds.length, results: data.data };
};

export const isOnline = () => navigator.onLine;
