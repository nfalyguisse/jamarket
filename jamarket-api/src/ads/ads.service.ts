import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { AdsMutationAction, MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  async findOne(id: number) {
    const ad = await this.prisma.ad.findFirst({
      where: { id, isArchived: false, deletedAt: null },
      include: AD_INCLUDE,
    });

    if (!ad) {
      throw new NotFoundException(`Annonce #${id} introuvable`);
    }

    return ad;
  }

  async findMine(
    requestUser: { id: number; role: { rights: RightEnum[] } },
    scope: 'mine' | 'all' = 'mine',
  ) {
    const showAll = scope === 'all';

    return this.prisma.ad.findMany({
      where: {
        isArchived: false,
        ...(showAll ? {} : { sellerId: requestUser.id }),
      },
      include: AD_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending(requestUser: { role: { rights: RightEnum[] } }) {
    this.assertCanManageAd(requestUser);

    return this.prisma.ad.findMany({
      where: {
        isActive: false,
        isSold: false,
        isArchived: false,
      },
      include: AD_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveAllPending(requestUser: { role: { rights: RightEnum[] } }) {
    this.assertCanManageAd(requestUser);

    const result = await this.prisma.ad.updateMany({
      where: {
        isActive: false,
        isSold: false,
        isArchived: false,
      },
      data: { isActive: true },
    });

    return { approved: result.count };
  }

  async create(dto: CreateAdDto, sellerId: number) {
    try {
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
        throw new ConflictException(
          'Ce véhicule est déjà associé à une annonce',
        );
      }

      const created = await this.prisma.ad.create({
        data: {
          label: dto.label,
          description: dto.description,
          price: dto.price,
          vehiculeId: dto.vehiculeId,
          sellerId,
          isActive: dto.isActive ?? true,
        },
        include: AD_INCLUDE,
      });
      this.metrics.recordAdsMutation('create', 'success');
      return created;
    } catch (error) {
      this.metrics.recordAdsMutation('create', 'error');
      throw error;
    }
  }

  async update(
    id: number,
    dto: UpdateAdDto,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    return this.runAdsMutation('update', async () => {
      await this.findOne(id);
      this.assertCanManageAd(requestUser);

      return this.prisma.ad.update({
        where: { id },
        data: { ...dto },
        include: AD_INCLUDE,
      });
    });
  }

  async remove(
    id: number,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    await this.findOne(id);
    this.assertCanManageAd(requestUser);

    return this.prisma.ad.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isArchived: true },
    });
  }

  async hardRemove(
    id: number,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    const ad = await this.findOne(id);

    const isAdmin = requestUser.role.rights.includes(RightEnum.SUPER_ADMIN);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Seul un super admin peut supprimer définitivement une annonce',
      );
    }

    await this.prisma.ad.delete({ where: { id: ad.id } });
  }

  async markAsSold(
    id: number,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    return this.runAdsMutation('sold', async () => {
      await this.findOne(id);
      this.assertCanManageAd(requestUser);

      return this.prisma.ad.update({
        where: { id },
        data: { isSold: true, isActive: false },
        include: AD_INCLUDE,
      });
    });
  }

  private async runAdsMutation<T>(
    action: AdsMutationAction,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      const result = await fn();
      this.metrics.recordAdsMutation(action, 'success');
      return result;
    } catch (error) {
      this.metrics.recordAdsMutation(action, 'error');
      throw error;
    }
  }

  private assertCanManageAd(user: { role: { rights: RightEnum[] } }) {
    const canManageGarageAds = user.role.rights.includes(RightEnum.CREATE_AD);

    if (!canManageGarageAds) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cette annonce",
      );
    }
  }
}
