import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { FilterAdDto } from './dto/filter-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

const AD_INCLUDE = {
  vehicule: {
    include: {
      model: { include: { brand: true } },
      vehiculeType: true,
      images: true,
    },
  },
  seller: {
    omit: { password: true },
  },
} as const;

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(filters: FilterAdDto) {
    const { brandId, modelId, priceMin, priceMax, kmMax, fuel, color, vehiculeTypeId, page = 1, limit = 12 } = filters;

    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      deletedAt: null,
      price: {
        ...(priceMin !== undefined && { gte: priceMin }),
        ...(priceMax !== undefined && { lte: priceMax }),
      },
      vehicule: {
        ...(fuel && { fuel }),
        ...(color && { color }),
        ...(vehiculeTypeId && { vehiculeTypeId }),
        ...(kmMax !== undefined && { kilometer: { lte: kmMax } }),
        ...(modelId && { modelId }),
        ...(brandId && { model: { brandId } }),
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        include: AD_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ad.count({ where }),
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
    const ad = await this.prisma.ad.findFirst({
      where: { id, deletedAt: null },
      include: AD_INCLUDE,
    });

    if (!ad) {
      throw new NotFoundException(`Annonce #${id} introuvable`);
    }

    return ad;
  }

  async create(dto: CreateAdDto, sellerId: number) {
    const vehicule = await this.prisma.vehicule.findUnique({
      where: { id: dto.vehiculeId },
    });

    if (!vehicule) {
      throw new NotFoundException(`Véhicule #${dto.vehiculeId} introuvable`);
    }

    const existingAd = await this.prisma.ad.findUnique({
      where: { vehiculeId: dto.vehiculeId },
    });

    if (existingAd) {
      throw new ConflictException('Ce véhicule est déjà associé à une annonce');
    }

    return this.prisma.ad.create({
      data: {
        label: dto.label,
        description: dto.description,
        price: dto.price,
        vehiculeId: dto.vehiculeId,
        sellerId,
      },
      include: AD_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateAdDto, requestUser: { id: number; role: { rights: RightEnum[] } }) {
    const ad = await this.findOne(id);

    this.checkOwnership(ad, requestUser);

    return this.prisma.ad.update({
      where: { id },
      data: { ...dto },
      include: AD_INCLUDE,
    });
  }

  async remove(id: number, requestUser: { id: number; role: { rights: RightEnum[] } }) {
    const ad = await this.findOne(id);

    this.checkOwnership(ad, requestUser);

    return this.prisma.ad.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async hardRemove(id: number, requestUser: { id: number; role: { rights: RightEnum[] } }) {
    const ad = await this.findOne(id);

    const isAdmin = requestUser.role.rights.includes(RightEnum.SUPER_ADMIN);
    if (!isAdmin) {
      throw new ForbiddenException('Seul un super admin peut supprimer définitivement une annonce');
    }

    await this.prisma.ad.delete({ where: { id: ad.id } });
  }

  async markAsSold(id: number, requestUser: { id: number; role: { rights: RightEnum[] } }) {
    const ad = await this.findOne(id);

    this.checkOwnership(ad, requestUser);

    return this.prisma.ad.update({
      where: { id },
      data: { isSold: true, isActive: false },
      include: AD_INCLUDE,
    });
  }

  private checkOwnership(
    ad: { sellerId: number | null },
    user: { id: number; role: { rights: RightEnum[] } },
  ) {
    const isAdmin = user.role.rights.includes(RightEnum.ADMIN);
    const isOwner = ad.sellerId === user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette annonce");
    }
  }
}
