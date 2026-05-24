import { memoryStorage } from 'multer';
import { UPLOAD_CONSTANTS } from './upload.constants';

export const imageMulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
    files: UPLOAD_CONSTANTS.MAX_FILES,
  },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (
      !(UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES as readonly string[]).includes(
        file.mimetype,
      )
    ) {
      callback(
        new Error('Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
