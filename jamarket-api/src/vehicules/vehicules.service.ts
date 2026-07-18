import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { FilterVehiculeDto } from './dto/filter-vehicule.dto';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';

const VEHICULE_INCLUDE = {
  model: { include: { brand: true } },
  vehiculeType: true,
  images: true,
  ad: {
    select: { id: true, label: true, price: true, isActive: true, isSold: true },
  },
} as const;

@Injectable()
export class VehiculesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async findAll(filters: FilterVehiculeDto) {
    const {
      brandId,
      modelId,
      fuel,
      vehiculeTypeId,
      kmMax,
      yearMin,
      yearMax,
      page = 1,
      limit = 12,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(fuel && { fuel }),
      ...(vehiculeTypeId && { vehiculeTypeId }),
      ...(kmMax !== undefined && { kilometer: { lte: kmMax } }),
      ...(modelId && { modelId }),
      ...(brandId && { model: { brandId } }),
      ...(yearMin !== undefined || yearMax !== undefined
        ? {
            year: {
              ...(yearMin !== undefined && { gte: yearMin }),
              ...(yearMax !== undefined && { lte: yearMax }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.vehicule.findMany({
        where,
        include: VEHICULE_INCLUDE,
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vehicule.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const vehicule = await this.prisma.vehicule.findFirst({
      where: { id, deletedAt: null },
      include: VEHICULE_INCLUDE,
    });

    if (!vehicule) {
      throw new NotFoundException(`Véhicule #${id} introuvable`);
    }

    return vehicule;
  }

  async create(dto: CreateVehiculeDto) {
    const { imageUrls, year, ...vehiculeData } = dto;

    const model = await this.prisma.model.findUnique({ where: { id: dto.modelId } });
    if (!model) {
      throw new NotFoundException(`Modèle #${dto.modelId} introuvable`);
    }

    const vehiculeType = await this.prisma.vehiculeType.findUnique({
      where: { id: dto.vehiculeTypeId },
    });
    if (!vehiculeType) {
      throw new NotFoundException(`Type de véhicule #${dto.vehiculeTypeId} introuvable`);
    }

    return this.prisma.vehicule.create({
      data: {
        ...vehiculeData,
        year,
        vehiculeYear: year,
        images: imageUrls?.length
          ? { create: imageUrls.map((url) => ({ url })) }
          : undefined,
      },
      include: VEHICULE_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateVehiculeDto) {
    await this.findOne(id);

    const { imageUrls, year, ...vehiculeData } = dto;

    if (dto.modelId) {
      const model = await this.prisma.model.findUnique({ where: { id: dto.modelId } });
      if (!model) throw new NotFoundException(`Modèle #${dto.modelId} introuvable`);
    }

    if (dto.vehiculeTypeId) {
      const vehiculeType = await this.prisma.vehiculeType.findUnique({
        where: { id: dto.vehiculeTypeId },
      });
      if (!vehiculeType) {
        throw new NotFoundException(`Type de véhicule #${dto.vehiculeTypeId} introuvable`);
      }
    }

    return this.prisma.vehicule.update({
      where: { id },
      data: {
        ...vehiculeData,
        ...(year !== undefined && { year, vehiculeYear: year }),
        ...(imageUrls !== undefined
          ? {
              images: {
                deleteMany: {},
                create: imageUrls.map((url) => ({ url })),
              },
            }
          : {}),
      },
      include: VEHICULE_INCLUDE,
    });
  }

  async remove(id: number) {
    const vehicule = await this.findOne(id);

    if (vehicule.ad) {
      throw new BadRequestException(
        'Ce véhicule est lié à une annonce active. Supprimez d\'abord l\'annonce.',
      );
    }

    return this.prisma.vehicule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardRemove(id: number) {
    const vehicule = await this.findOne(id);

    if (vehicule.ad) {
      throw new ConflictException(
        'Ce véhicule est lié à une annonce. Supprimez définitivement l\'annonce avant de supprimer le véhicule.',
      );
    }

    await this.uploadService.deleteAllVehiculeImages(id);
    await this.prisma.vehicule.delete({ where: { id } });
  }
}
