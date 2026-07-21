import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  onModuleInit(): void {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Variables Cloudinary manquantes : CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    publicId?: string,
  ): Promise<CloudinaryUploadResult> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'image',
            overwrite: false,
            // Conversion WebP + qualité auto (éco-conception)
            format: 'webp',
            quality: 'auto',
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error ?? new Error('Réponse Cloudinary vide'));
              return;
            }
            resolve(uploadResult);
          },
        );
        stream.end(buffer);
      });

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        bytes: result.bytes,
        format: result.format,
      };
    } catch (error) {
      this.logger.error('Échec upload Cloudinary', error);
      throw new InternalServerErrorException(
        'Impossible d’uploader l’image vers Cloudinary',
      );
    }
  }

  async destroy(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
    } catch (error) {
      this.logger.warn(`Échec suppression Cloudinary (${publicId})`, error);
    }
  }

  /**
   * Extrait le public_id depuis une URL Cloudinary.
   * Ex. https://res.cloudinary.com/demo/image/upload/v123/jamarket/vehicules/1/abc.webp
   *  → jamarket/vehicules/1/abc
   */
  extractPublicIdFromUrl(url: string): string | null {
    if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
      return null;
    }

    const match = url.match(
      /\/(jamarket\/(?:vehicules|users)\/[^/?#]+\/[^/?#.]+)(?:\.[a-zA-Z0-9]+)?(?:[?#]|$)/,
    );
    return match?.[1] ?? null;
  }
}
