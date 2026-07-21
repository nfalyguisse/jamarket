export const UPLOAD_CONSTANTS = {
  MAX_FILES: 10,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;
