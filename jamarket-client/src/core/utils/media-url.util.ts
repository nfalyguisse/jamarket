import { environment } from '../../environments/environment';

const API_ORIGIN = environment.apiUrl.replace(/\/api\/?$/, '');

/** Médias distants (Cloudinary, Unsplash seed) activés. */
export const DISABLE_REMOTE_MEDIA = false;

export const VEHICLE_IMAGE_PLACEHOLDER = '/assets/images/vehicle-placeholder.svg';

export function resolveMediaUrl(url: string): string {
  if (!url) {
    return VEHICLE_IMAGE_PLACEHOLDER;
  }

  // Previews locales (upload admin) : laisser passer
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  if (DISABLE_REMOTE_MEDIA) {
    return VEHICLE_IMAGE_PLACEHOLDER;
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
