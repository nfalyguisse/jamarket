import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { CreateVehiculeTypeDto } from './dto/create-vehicule-type.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async createBrand(dto: CreateBrandDto) {
    const label = dto.label.trim();

    const existing = await this.prisma.brand.findFirst({
      where: { label: { equals: label, mode: 'insensitive' } },
      select: { id: true, label: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.brand.create({
      data: { label },
      select: { id: true, label: true },
    });
  }

  async createModel(dto: CreateModelDto) {
    const label = dto.label.trim();

    const brand = await this.prisma.brand.findUnique({
      where: { id: dto.brandId },
      select: { id: true },
    });

    if (!brand) {
      throw new NotFoundException(`Marque #${dto.brandId} introuvable`);
    }

    const existing = await this.prisma.model.findFirst({
      where: {
        brandId: dto.brandId,
        label: { equals: label, mode: 'insensitive' },
      },
      select: { id: true, label: true, brandId: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.model.create({
      data: { label, brandId: dto.brandId },
      select: { id: true, label: true, brandId: true },
    });
  }

  async createVehiculeType(dto: CreateVehiculeTypeDto) {
    const label = dto.label.trim();

    const existing = await this.prisma.vehiculeType.findFirst({
      where: { label: { equals: label, mode: 'insensitive' } },
      select: { id: true, label: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.vehiculeType.create({
      data: { label },
      select: { id: true, label: true },
    });
  }
}
