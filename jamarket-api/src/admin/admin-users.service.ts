import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isCustomerOnlyRole } from './admin-role.helpers';
import { AdminRolesService } from './admin-roles.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminRolesService: AdminRolesService,
  ) {}

  async findAll(filters: FilterUsersDto) {
    const { search, roleId, garageOnly, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const garageRoleIds = garageOnly
      ? await this.adminRolesService.getGarageRoleIds()
      : undefined;

    const where = {
      deletedAt: null,
      ...(garageOnly && garageRoleIds?.length
        ? { roleId: { in: garageRoleIds } }
        : roleId && { roleId }),
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

  getAssignableRoles() {
    return this.adminRolesService.getAssignableRoles();
  }

  async banUser(
    targetId: number,
    dto: BanUserDto,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    this.assertIsSuperAdmin(requestUser);

    if (targetId === requestUser.id) {
      throw new BadRequestException('Vous ne pouvez pas bannir votre propre compte');
    }

    const user = await this.findActiveUser(targetId);
    this.assertIsCustomer(user);

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
    this.assertIsSuperAdmin(requestUser);

    if (targetId === requestUser.id) {
      throw new BadRequestException('Vous ne pouvez pas modifier votre propre rôle');
    }

    const user = await this.findActiveUser(targetId);
    this.assertIsGarageStaff(user);

    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, deletedAt: null },
      select: { id: true, rights: true },
    });

    if (!role) {
      throw new NotFoundException(`Rôle #${dto.roleId} introuvable`);
    }

    if (isCustomerOnlyRole(role.rights)) {
      throw new BadRequestException(
        'Un rôle client ne peut pas être attribué à un membre du garage',
      );
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

  private assertIsSuperAdmin(requestUser: { role: { rights: RightEnum[] } }) {
    if (!requestUser.role.rights.includes(RightEnum.SUPER_ADMIN)) {
      throw new ForbiddenException('Seul un super administrateur peut gérer les utilisateurs');
    }
  }

  private assertIsCustomer(target: { role: { rights: RightEnum[] } }) {
    if (!isCustomerOnlyRole(target.role.rights)) {
      throw new BadRequestException(
        'Seuls les comptes clients peuvent être désactivés depuis cette interface',
      );
    }
  }

  private assertIsGarageStaff(target: { role: { rights: RightEnum[] } }) {
    if (isCustomerOnlyRole(target.role.rights)) {
      throw new BadRequestException(
        'Seuls les comptes administrateur et employé du garage peuvent être modifiés',
      );
    }
  }
}
