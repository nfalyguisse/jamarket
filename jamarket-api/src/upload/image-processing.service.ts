import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { extensionFromMime, UPLOAD_DIR, UPLOAD_URL_PREFIX } from './upload.constants';

export interface ProcessedImage {
  filename: string;
  url: string;
  absolutePath: string;
  sizeBytes: number;
}

@Injectable()
export class ImageProcessingService {
  async processAndSave(
    vehiculeId: number,
    file: Express.Multer.File,
  ): Promise<ProcessedImage> {
    const vehiculeDir = path.join(UPLOAD_DIR, 'vehicules', String(vehiculeId));
    await fs.mkdir(vehiculeDir, { recursive: true });

    const ext = extensionFromMime(file.mimetype, file.originalname);
    const filename = `${randomUUID()}${ext}`;
    const absolutePath = path.join(vehiculeDir, filename);

    await fs.writeFile(absolutePath, file.buffer);

    const url = `${UPLOAD_URL_PREFIX}/vehicules/${vehiculeId}/${filename}`;

    return {
      filename,
      url,
      absolutePath,
      sizeBytes: file.size,
    };
  }

  async processAndSaveUserAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<ProcessedImage> {
    const userDir = path.join(UPLOAD_DIR, 'users', String(userId));
    await fs.mkdir(userDir, { recursive: true });

    const ext = extensionFromMime(file.mimetype, file.originalname);
    const filename = `${randomUUID()}${ext}`;
    const absolutePath = path.join(userDir, filename);

    await fs.writeFile(absolutePath, file.buffer);

    const url = `${UPLOAD_URL_PREFIX}/users/${userId}/${filename}`;

    return {
      filename,
      url,
      absolutePath,
      sizeBytes: file.size,
    };
  }

  async deleteFile(absolutePath: string): Promise<void> {
    try {
      await fs.unlink(absolutePath);
    } catch {
      // Fichier déjà absent — ignoré
    }
  }

  urlToAbsolutePath(url: string): string | null {
    const prefix = `${UPLOAD_URL_PREFIX}/`;
    if (!url.startsWith(prefix)) {
      return null;
    }
    const relative = url.slice(prefix.length);
    return path.join(UPLOAD_DIR, relative);
  }
}
