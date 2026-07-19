import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        ad: {
          isArchived: false,
          deletedAt: null,
        },
      },
      include: {
        ad: { include: AD_INCLUDE },
      },
      orderBy: { id: 'desc' },
    });

    return favorites.map((favorite) => favorite.ad);
  }

  async listIds(userId: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        ad: {
          isArchived: false,
          deletedAt: null,
        },
      },
      select: { adId: true },
      orderBy: { id: 'desc' },
    });

    return favorites.map((favorite) => favorite.adId);
  }

  async add(userId: number, adId: number) {
    await this.assertAdExists(adId);

    try {
      const favorite = await this.prisma.favorite.create({
        data: { userId, adId },
        include: {
          ad: { include: AD_INCLUDE },
        },
      });
      return favorite.ad;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException(`L'annonce #${adId} est déjà en favoris`);
      }
      throw error;
    }
  }

  async remove(userId: number, adId: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_adId: { userId, adId },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Favori pour l'annonce #${adId} introuvable`);
    }

    await this.prisma.favorite.delete({
      where: { userId_adId: { userId, adId } },
    });

    return { removed: true, adId };
  }

  private async assertAdExists(adId: number) {
    const ad = await this.prisma.ad.findFirst({
      where: { id: adId, isArchived: false, deletedAt: null },
      select: { id: true },
    });

    if (!ad) {
      throw new NotFoundException(`Annonce #${adId} introuvable`);
    }
  }
}
