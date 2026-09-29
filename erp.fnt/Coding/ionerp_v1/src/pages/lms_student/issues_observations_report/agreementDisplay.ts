import { HistoryItem } from './studentReportsService';

// Use the start of the current agreed period, not the most recent edit date.
export function agreementDate(history: HistoryItem[], field: 'mentor_status' | 'mentee_status', currentStatus: number): string | null {
  const agreedStatus = field === 'mentor_status' ? 2 : 1;
  if (currentStatus !== agreedStatus) return null;
  const ordered = [...history].sort((a, b) => a.action_timestamp.localeCompare(b.action_timestamp) || a.history_id - b.history_id);
  let previous: number | undefined;
  let agreedAt: string | null = null;
  for (const item of ordered) {
    if (item[field] !== agreedStatus) agreedAt = null;
    else if (previous !== agreedStatus) {
      // A first 'update' snapshot cannot prove when an existing agreement occurred.
      agreedAt = previous !== undefined || item.action_type === 'insert' ? item.action_timestamp : null;
    }
    previous = item[field];
  }
  return agreedAt;
}
