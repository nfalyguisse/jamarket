import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CloudinaryService } from './cloudinary.service';

export interface ProcessedImage {
  filename: string;
  url: string;
  publicId: string;
  sizeBytes: number;
}

@Injectable()
export class ImageProcessingService {
  constructor(private readonly cloudinary: CloudinaryService) {}

  async processAndSave(
    vehiculeId: number,
    file: Express.Multer.File,
  ): Promise<ProcessedImage> {
    const publicId = randomUUID();
    const folder = `jamarket/vehicules/${vehiculeId}`;

    const uploaded = await this.cloudinary.uploadBuffer(
      file.buffer,
      folder,
      publicId,
    );

    return {
      filename: publicId,
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      sizeBytes: uploaded.bytes,
    };
  }

  async processAndSaveUserAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<ProcessedImage> {
    const publicId = randomUUID();
    const folder = `jamarket/users/${userId}`;

    const uploaded = await this.cloudinary.uploadBuffer(
      file.buffer,
      folder,
      publicId,
    );

    return {
      filename: publicId,
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      sizeBytes: uploaded.bytes,
    };
  }

  async deleteByUrl(url: string): Promise<void> {
    const publicId = this.cloudinary.extractPublicIdFromUrl(url);
    if (publicId) {
      await this.cloudinary.destroy(publicId);
    }
  }
}
