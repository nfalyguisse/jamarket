import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BanUserDto } from './dto/ban-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

const USER_SELECT = {
  id: true,
  name: true,
  lastName: true,
  email: true,
  isActive: true,
  roleId: true,
  createdAt: true,
  role: { select: { id: true, label: true, rights: true } },
} as const;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterUsersDto) {
    const { search, roleId, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(roleId && { roleId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async banUser(
    targetId: number,
    dto: BanUserDto,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    if (targetId === requestUser.id) {
      throw new BadRequestException('Vous ne pouvez pas bannir votre propre compte');
    }

    const user = await this.findActiveUser(targetId);
    this.assertCanManageUser(user, requestUser);

    return this.prisma.user.update({
      where: { id: targetId },
      data: { isActive: !dto.banned },
      select: USER_SELECT,
    });
  }

  async updateRole(
    targetId: number,
    dto: UpdateUserRoleDto,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    if (targetId === requestUser.id) {
      throw new BadRequestException('Vous ne pouvez pas modifier votre propre rôle');
    }

    const user = await this.findActiveUser(targetId);
    this.assertCanManageUser(user, requestUser);

    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, deletedAt: null },
    });

    if (!role) {
      throw new NotFoundException(`Rôle #${dto.roleId} introuvable`);
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { roleId: dto.roleId },
      select: USER_SELECT,
    });
  }

  private async findActiveUser(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${id} introuvable`);
    }

    return user;
  }

  private assertCanManageUser(
    target: { role: { rights: RightEnum[] } },
    requestUser: { role: { rights: RightEnum[] } },
  ) {
    const targetIsAdmin = target.role.rights.includes(RightEnum.MANAGE_USER);
    const requesterIsAdmin = requestUser.role.rights.includes(RightEnum.MANAGE_USER);

    if (targetIsAdmin && !requesterIsAdmin) {
      throw new ForbiddenException('Vous ne pouvez pas modifier un administrateur');
    }
  }
}
