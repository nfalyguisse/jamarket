import { Injectable } from '@nestjs/common';
import { FuelType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchAdDto, SearchSort } from './dto/search-ad.dto';

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

const ACTIVE_AD_WHERE: Prisma.AdWhereInput = {
  isActive: true,
  isSold: false,
  isArchived: false,
  deletedAt: null,
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SearchAdDto) {
    const {
      page = 1,
      limit = 12,
      sort = SearchSort.DATE_DESC,
      brand,
      brandId,
      model,
      modelId,
      mileage,
      kmMax,
      mileageMin,
      priceMin,
      priceMax,
      fuel,
      location,
      color,
      vehiculeTypeId,
      yearMin,
      yearMax,
      q,
    } = dto;

    const resolvedBrandId = brand ?? brandId;
    const resolvedModelId = model ?? modelId;
    const resolvedKmMax = mileage ?? kmMax;

    const skip = (page - 1) * limit;
    const where = this.buildWhere({
      brandId: resolvedBrandId,
      modelId: resolvedModelId,
      kmMax: resolvedKmMax,
      mileageMin,
      priceMin,
      priceMax,
      fuel,
      location,
      color,
      vehiculeTypeId,
      yearMin,
      yearMax,
      q,
    });

    const [data, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        include: AD_INCLUDE,
        orderBy: this.buildOrderBy(sort),
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
        sort,
        filters: this.buildAppliedFilters(dto),
      },
    };
  }

  async getFilterOptions(brandId?: number) {
    const vehiculeWhere: Prisma.VehiculeWhereInput = {
      deletedAt: null,
      ad: { is: ACTIVE_AD_WHERE },
      ...(brandId && { model: { brandId } }),
    };

    const [brands, models, vehiculeTypes, fuels, priceAgg, mileageAgg] =
      await Promise.all([
        this.prisma.brand.findMany({
          where: {
            models: {
              some: {
                vehicles: {
                  some: {
                    deletedAt: null,
                    ad: { is: ACTIVE_AD_WHERE },
                  },
                },
              },
            },
          },
          select: { id: true, label: true },
          orderBy: { label: 'asc' },
        }),
        this.prisma.model.findMany({
          where: {
            ...(brandId && { brandId }),
            vehicles: {
              some: {
                deletedAt: null,
                ad: { is: ACTIVE_AD_WHERE },
              },
            },
          },
          select: { id: true, label: true, brandId: true },
          orderBy: { label: 'asc' },
        }),
        this.prisma.vehiculeType.findMany({
          where: {
            vehicles: {
              some: {
                deletedAt: null,
                ad: { is: ACTIVE_AD_WHERE },
              },
            },
          },
          select: { id: true, label: true },
          orderBy: { label: 'asc' },
        }),
        this.prisma.vehicule.findMany({
          where: vehiculeWhere,
          select: { fuel: true },
          distinct: ['fuel'],
        }),
        this.prisma.ad.aggregate({
          where: ACTIVE_AD_WHERE,
          _min: { price: true },
          _max: { price: true },
        }),
        this.prisma.vehicule.aggregate({
          where: vehiculeWhere,
          _min: { kilometer: true },
          _max: { kilometer: true },
        }),
      ]);

    return {
      brands,
      models,
      vehiculeTypes,
      fuelTypes: fuels.map((v) => v.fuel),
      priceRange: {
        min: priceAgg._min.price ?? 0,
        max: priceAgg._max.price ?? 0,
      },
      mileageRange: {
        min: mileageAgg._min.kilometer ?? 0,
        max: mileageAgg._max.kilometer ?? 0,
      },
    };
  }

  async getFormReferences(brandId?: number) {
    const [brands, models, vehiculeTypes] = await Promise.all([
      this.prisma.brand.findMany({
        select: { id: true, label: true },
        orderBy: { label: 'asc' },
      }),
      this.prisma.model.findMany({
        where: brandId ? { brandId } : {},
        select: { id: true, label: true, brandId: true },
        orderBy: { label: 'asc' },
      }),
      this.prisma.vehiculeType.findMany({
        select: { id: true, label: true },
        orderBy: { label: 'asc' },
      }),
    ]);

    return {
      brands,
      models,
      vehiculeTypes,
      fuelTypes: ['essence', 'diesel', 'electrique', 'hybride'],
    };
  }

  private buildWhere(params: {
    brandId?: number;
    modelId?: number;
    kmMax?: number;
    mileageMin?: number;
    priceMin?: number;
    priceMax?: number;
    fuel?: FuelType;
    location?: string;
    color?: string;
    vehiculeTypeId?: number;
    yearMin?: number;
    yearMax?: number;
    q?: string;
  }): Prisma.AdWhereInput {
    const vehiculeFilters: Prisma.VehiculeWhereInput = {
      deletedAt: null,
      ...(params.fuel && { fuel: params.fuel }),
      ...(params.color && {
        color: { contains: params.color, mode: 'insensitive' },
      }),
      ...(params.vehiculeTypeId && { vehiculeTypeId: params.vehiculeTypeId }),
      ...(params.modelId && { modelId: params.modelId }),
      ...(params.brandId && { model: { brandId: params.brandId } }),
      ...(params.kmMax !== undefined || params.mileageMin !== undefined
        ? {
            kilometer: {
              ...(params.mileageMin !== undefined && {
                gte: params.mileageMin,
              }),
              ...(params.kmMax !== undefined && { lte: params.kmMax }),
            },
          }
        : {}),
      ...(params.yearMin !== undefined || params.yearMax !== undefined
        ? {
            year: {
              ...(params.yearMin !== undefined && { gte: params.yearMin }),
              ...(params.yearMax !== undefined && { lte: params.yearMax }),
            },
          }
        : {}),
    };

    const hasVehiculeFilters =
      Object.keys(vehiculeFilters).filter((k) => k !== 'deletedAt').length > 0;

    const textOr: Prisma.AdWhereInput[] = [];
    if (params.q) {
      textOr.push(
        { label: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      );
    }
    if (params.location) {
      textOr.push(
        { label: { contains: params.location, mode: 'insensitive' } },
        { description: { contains: params.location, mode: 'insensitive' } },
      );
    }

    return {
      ...ACTIVE_AD_WHERE,
      ...(params.priceMin !== undefined || params.priceMax !== undefined
        ? {
            price: {
              ...(params.priceMin !== undefined && { gte: params.priceMin }),
              ...(params.priceMax !== undefined && { lte: params.priceMax }),
            },
          }
        : {}),
      ...(hasVehiculeFilters && { vehicule: vehiculeFilters }),
      ...(textOr.length > 0 && { OR: textOr }),
    };
  }

  private buildOrderBy(sort: SearchSort): Prisma.AdOrderByWithRelationInput {
    switch (sort) {
      case SearchSort.PRICE_ASC:
        return { price: 'asc' };
      case SearchSort.PRICE_DESC:
        return { price: 'desc' };
      case SearchSort.MILEAGE_ASC:
        return { vehicule: { kilometer: 'asc' } };
      case SearchSort.MILEAGE_DESC:
        return { vehicule: { kilometer: 'desc' } };
      case SearchSort.DATE_DESC:
      default:
        return { createdAt: 'desc' };
    }
  }

  private buildAppliedFilters(dto: SearchAdDto) {
    return {
      brand: dto.brand ?? dto.brandId,
      model: dto.model ?? dto.modelId,
      priceMin: dto.priceMin,
      priceMax: dto.priceMax,
      mileage: dto.mileage ?? dto.kmMax,
      mileageMin: dto.mileageMin,
      fuel: dto.fuel,
      location: dto.location,
      color: dto.color,
      vehiculeTypeId: dto.vehiculeTypeId,
      yearMin: dto.yearMin,
      yearMax: dto.yearMax,
      q: dto.q,
    };
  }
}
