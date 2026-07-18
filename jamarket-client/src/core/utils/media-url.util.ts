import { environment } from '../../environments/environment';

const API_ORIGIN = environment.apiUrl.replace(/\/api\/?$/, '');

export function resolveMediaUrl(url: string): string {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/api/')) {
    return `${API_ORIGIN}${url}`;
  }

  if (url.startsWith('/')) {
    return `${API_ORIGIN}${url}`;
  }

  return url;
}
