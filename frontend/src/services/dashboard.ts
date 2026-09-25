import { api } from './api';
import { summary } from '../mock/data';

export async function getDashboardSummary() {
  if (import.meta.env.VITE_USE_MOCKS !== 'false') {
    return Promise.resolve(summary);
  }

  const { data } = await api.get(
    '/api/dashboard/summary'
  );

  return data;
}