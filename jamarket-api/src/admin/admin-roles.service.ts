import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isCustomerOnlyRole, RIGHT_LABELS } from './admin-role.helpers';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const ROLE_SELECT = {
  id: true,
  label: true,
  rights: true,
  deletedAt: true,
  _count: { select: { users: true } },
} as const;

@Injectable()
export class AdminRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      select: ROLE_SELECT,
      orderBy: { id: 'asc' },
    });

    return roles.map((role) => this.mapRole(role));
  }

  async findOne(id: number) {
    const role = await this.findActiveRole(id);
    return this.mapRole(role);
  }

  getAvailableRights() {
    return Object.values(RightEnum).map((value) => ({
      value,
      label: RIGHT_LABELS[value],
    }));
  }

  async getAssignableRoles() {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      select: { id: true, label: true, rights: true },
      orderBy: { id: 'asc' },
    });

    return roles
      .filter((role) => !isCustomerOnlyRole(role.rights))
      .map(({ id, label }) => ({ id, label }));
  }

  async getGarageRoleIds(): Promise<number[]> {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      select: { id: true, rights: true },
    });

    return roles
      .filter((role) => !isCustomerOnlyRole(role.rights))
      .map((role) => role.id);
  }

  async create(dto: CreateRoleDto) {
    const label = dto.label.trim();
    await this.assertLabelIsUnique(label);

    const role = await this.prisma.role.create({
      data: {
        label,
        rights: dto.rights,
      },
      select: ROLE_SELECT,
    });

    return this.mapRole(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.findActiveRole(id);

    if (dto.label !== undefined) {
      const label = dto.label.trim();
      if (!label) {
        throw new BadRequestException('Le nom du rôle est obligatoire');
      }
      if (label.toLowerCase() !== role.label.toLowerCase()) {
        await this.assertLabelIsUnique(label, id);
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label.trim() }),
        ...(dto.rights !== undefined && { rights: dto.rights }),
      },
      select: ROLE_SELECT,
    });

    return this.mapRole(updated);
  }

  async remove(id: number) {
    await this.findActiveRole(id);

    const userCount = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new ConflictException(
        `Ce rôle est assigné à ${userCount} utilisateur${userCount > 1 ? 's' : ''}. Réattribuez-les avant de le supprimer.`,
      );
    }

    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findActiveRole(id: number) {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      select: ROLE_SELECT,
    });

    if (!role) {
      throw new NotFoundException(`Rôle #${id} introuvable`);
    }

    return role;
  }

  private async assertLabelIsUnique(label: string, excludeId?: number) {
    const existing = await this.prisma.role.findFirst({
      where: {
        deletedAt: null,
        label: { equals: label, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`Le rôle « ${label} » existe déjà`);
    }
  }

  private mapRole(role: {
    id: number;
    label: string;
    rights: RightEnum[];
    deletedAt: Date | null;
    _count: { users: number };
  }) {
    return {
      id: role.id,
      label: role.label,
      rights: role.rights,
      userCount: role._count.users,
      deletedAt: role.deletedAt,
    };
  }
}
