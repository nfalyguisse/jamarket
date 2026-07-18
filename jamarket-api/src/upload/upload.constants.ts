import * as path from 'path';

export const UPLOAD_CONSTANTS = {
  MAX_FILES: 10,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
export const UPLOAD_URL_PREFIX = process.env.UPLOAD_URL_PREFIX ?? '/uploads';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export function extensionFromMime(mimetype: string, originalname: string): string {
  const fromMime = MIME_TO_EXT[mimetype];
  if (fromMime) {
    return fromMime;
  }

  const ext = path.extname(originalname).toLowerCase();
  return ext || '.jpg';
}
