import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { RightEnum } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isCustomerOnlyRole } from './admin-role.helpers';
import { AdminRolesService } from './admin-roles.service';
import { BanUserDto } from './dto/ban-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
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

const BCRYPT_ROUNDS = 10;
const TEMP_PASSWORD_LENGTH = 8;
const TEMP_PASSWORD_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminRolesService: AdminRolesService,
  ) {}

  async findAll(filters: FilterUsersDto) {
    const {
      search,
      roleId,
      garageOnly,
      isActive,
      page = 1,
      limit = 20,
    } = filters;
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

  getAssignableRoles(requestUser: { role: { rights: RightEnum[] } }) {
    this.assertCanManageUsers(requestUser);
    return this.adminRolesService.getAssignableRoles(
      requestUser.role.rights.includes(RightEnum.SUPER_ADMIN),
    );
  }

  async create(
    dto: CreateUserDto,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    this.assertCanManageUsers(requestUser);

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

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

    this.assertCannotGrantSuperAdmin(requestUser, role.rights);

    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        lastName: dto.lastName.trim(),
        email,
        password: hashedPassword,
        roleId: dto.roleId,
        isActive: true,
      },
      select: USER_SELECT,
    });

    return { user, temporaryPassword };
  }

  async banUser(
    targetId: number,
    dto: BanUserDto,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    this.assertCanManageUsers(requestUser);

    if (targetId === requestUser.id) {
      throw new BadRequestException(
        'Vous ne pouvez pas désactiver votre propre compte',
      );
    }

    const target = await this.findActiveUser(targetId);
    this.assertCannotTargetSuperAdmin(requestUser, target.role.rights);

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
    this.assertCanManageUsers(requestUser);

    if (targetId === requestUser.id) {
      throw new BadRequestException(
        'Vous ne pouvez pas modifier votre propre rôle',
      );
    }

    const user = await this.findActiveUser(targetId);
    this.assertIsGarageStaff(user);
    this.assertCannotTargetSuperAdmin(requestUser, user.role.rights);

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

    this.assertCannotGrantSuperAdmin(requestUser, role.rights);

    return this.prisma.user.update({
      where: { id: targetId },
      data: { roleId: dto.roleId },
      select: USER_SELECT,
    });
  }

  async resetPassword(
    targetId: number,
    requestUser: { id: number; role: { rights: RightEnum[] } },
  ) {
    this.assertCanManageUsers(requestUser);

    if (targetId === requestUser.id) {
      throw new BadRequestException(
        'Vous ne pouvez pas régénérer votre propre mot de passe depuis cette interface',
      );
    }

    const user = await this.findActiveUser(targetId);
    this.assertIsGarageStaff(user);
    this.assertCannotTargetSuperAdmin(requestUser, user.role.rights);

    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { password: hashedPassword },
      select: USER_SELECT,
    });

    return { user: updated, temporaryPassword };
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

  private assertCanManageUsers(requestUser: { role: { rights: RightEnum[] } }) {
    const canManage =
      requestUser.role.rights.includes(RightEnum.MANAGE_USER) ||
      requestUser.role.rights.includes(RightEnum.SUPER_ADMIN);

    if (!canManage) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à gérer les utilisateurs",
      );
    }
  }

  private assertCannotGrantSuperAdmin(
    requestUser: { role: { rights: RightEnum[] } },
    targetRights: RightEnum[],
  ) {
    if (
      targetRights.includes(RightEnum.SUPER_ADMIN) &&
      !requestUser.role.rights.includes(RightEnum.SUPER_ADMIN)
    ) {
      throw new ForbiddenException(
        'Seul un super administrateur peut attribuer un rôle super-admin',
      );
    }
  }

  private assertCannotTargetSuperAdmin(
    requestUser: { role: { rights: RightEnum[] } },
    targetRights: RightEnum[],
  ) {
    if (
      targetRights.includes(RightEnum.SUPER_ADMIN) &&
      !requestUser.role.rights.includes(RightEnum.SUPER_ADMIN)
    ) {
      throw new ForbiddenException(
        'Seul un super administrateur peut modifier un compte super-admin',
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

  private generateTemporaryPassword(): string {
    let password = '';
    for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
      password += TEMP_PASSWORD_CHARS[randomInt(TEMP_PASSWORD_CHARS.length)];
    }
    return password;
  }
}
