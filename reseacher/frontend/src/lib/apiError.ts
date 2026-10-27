import axios from 'axios';
export function apiErrorMessage(error: unknown, fallback = 'The request could not be completed.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response || error.response.status >= 500) return 'The service is temporarily unavailable. Please try again shortly.';
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg || 'Invalid input').join('. ');
    if (detail && typeof detail.message === 'string') return detail.message;
  }
  return error instanceof Error ? error.message : fallback;
}
