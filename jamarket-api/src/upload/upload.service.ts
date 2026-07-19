import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageProcessingService } from './image-processing.service';
import { UPLOAD_CONSTANTS } from './upload.constants';

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  async uploadVehiculeImages(vehiculeId: number, files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier image fourni');
    }

    if (files.length > UPLOAD_CONSTANTS.MAX_FILES) {
      throw new BadRequestException(
        `Maximum ${UPLOAD_CONSTANTS.MAX_FILES} images par envoi`,
      );
    }

    const vehicule = await this.prisma.vehicule.findFirst({
      where: { id: vehiculeId, deletedAt: null },
    });

    if (!vehicule) {
      throw new NotFoundException(`Véhicule #${vehiculeId} introuvable`);
    }

    const existingCount = await this.prisma.image.count({
      where: { vehiculeId },
    });

    if (existingCount + files.length > UPLOAD_CONSTANTS.MAX_FILES) {
      throw new BadRequestException(
        `Ce véhicule ne peut pas dépasser ${UPLOAD_CONSTANTS.MAX_FILES} images au total`,
      );
    }

    const processed = await Promise.all(
      files.map((file) =>
        this.imageProcessing.processAndSave(vehiculeId, file),
      ),
    );

    const images = await Promise.all(
      processed.map((img) =>
        this.prisma.image.create({
          data: { url: img.url, vehiculeId },
        }),
      ),
    );

    return {
      vehiculeId,
      uploaded: images.length,
      images,
    };
  }

  async deleteVehiculeImage(vehiculeId: number, imageId: number) {
    const image = await this.prisma.image.findFirst({
      where: { id: imageId, vehiculeId },
    });

    if (!image) {
      throw new NotFoundException(
        `Image #${imageId} introuvable pour le véhicule #${vehiculeId}`,
      );
    }

    const absolutePath = this.imageProcessing.urlToAbsolutePath(image.url);
    if (absolutePath) {
      await this.imageProcessing.deleteFile(absolutePath);
    }

    await this.prisma.image.delete({ where: { id: imageId } });

    return { deleted: true, imageId };
  }

  async deleteAllVehiculeImages(vehiculeId: number): Promise<void> {
    const images = await this.prisma.image.findMany({ where: { vehiculeId } });

    await Promise.all(
      images.map(async (image) => {
        const absolutePath = this.imageProcessing.urlToAbsolutePath(image.url);
        if (absolutePath) {
          await this.imageProcessing.deleteFile(absolutePath);
        }
      }),
    );

    await this.prisma.image.deleteMany({ where: { vehiculeId } });
  }
}
