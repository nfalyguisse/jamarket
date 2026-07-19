import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ImageProcessingService } from '../upload/image-processing.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { RightEnum } from 'generated/prisma/enums';

const BCRYPT_ROUNDS = 10;
const DEFAULT_CUSTOMER_ROLE_LABEL = 'Customer';
/** Rôle Customer en base (seed) — seuls ces comptes peuvent utiliser l’app cliente. */
const CUSTOMER_ROLE_ID = 3;
const INVALID_CREDENTIALS_MESSAGE =
  "L'email ou le mot de passe est incorrect.";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as JwtSignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as JwtSignOptions['expiresIn'];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly imageProcessing: ImageProcessingService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const customerRole = await this.prisma.role.findFirst({
      where: { label: DEFAULT_CUSTOMER_ROLE_LABEL },
    });

    if (!customerRole) {
      throw new UnauthorizedException('Rôle par défaut introuvable');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        roleId: customerRole.id,
      },
      include: { role: true },
    });

    return this.buildTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    this.assertClientCustomer(user);

    return this.buildTokens(user);
  }

  async adminLogin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    this.assertBackOfficeAccess(user);

    return this.buildTokens(user);
  }

  async getAdminProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
      omit: { password: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    this.assertBackOfficeAccess(user);

    return user;
  }

  async updateAdminProfile(userId: number, dto: UpdateAdminProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    this.assertBackOfficeAccess(user);

    const data: { name?: string; lastName?: string } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;

    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: { role: true },
      omit: { password: true },
    });
  }

  async changeAdminPassword(userId: number, dto: ChangeAdminPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    this.assertBackOfficeAccess(user);

    const passwordMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('Le mot de passe actuel est incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      include: { role: true },
      omit: { password: true },
    });
  }

  async uploadAdminAvatar(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    this.assertBackOfficeAccess(user);

    if (user.avatarUrl) {
      const oldPath = this.imageProcessing.urlToAbsolutePath(user.avatarUrl);
      if (oldPath) {
        await this.imageProcessing.deleteFile(oldPath);
      }
    }

    const processed = await this.imageProcessing.processAndSaveUserAvatar(userId, file);

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: processed.url },
      include: { role: true },
      omit: { password: true },
    });
  }

  async deleteAdminAvatar(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    this.assertBackOfficeAccess(user);

    if (user.avatarUrl) {
      const oldPath = this.imageProcessing.urlToAbsolutePath(user.avatarUrl);
      if (oldPath) {
        await this.imageProcessing.deleteFile(oldPath);
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      include: { role: true },
      omit: { password: true },
    });
  }

  async refresh(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    this.assertClientCustomer(user);

    return this.buildTokens(user);
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
      omit: { password: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    this.assertClientCustomer(user);

    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    this.assertClientCustomer(user);

    const data: { name?: string; lastName?: string; password?: string } = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { role: true },
      omit: { password: true },
    });

    return updated;
  }

  async forgetMe(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    this.assertClientCustomer(user);

    const anonymizedEmail = `deleted_${userId}@supprime.jamarket`;

    await this.prisma.$transaction(async (tx) => {
      await tx.favorite.deleteMany({ where: { userId } });

      await tx.ad.updateMany({
        where: { sellerId: userId, isArchived: false },
        data: { deletedAt: new Date(), isActive: false, isArchived: true },
      });

      // Anonymise le compte : les conversations/messages restent pour l’historique
      // de l’interlocuteur, mais s’affichent comme « Utilisateur supprimé ».
      await tx.user.update({
        where: { id: userId },
        data: {
          name: 'Utilisateur',
          lastName: 'supprimé',
          email: anonymizedEmail,
          password: '',
          avatarUrl: null,
          isActive: false,
          deletedAt: new Date(),
        },
      });
    });
  }

  private assertClientCustomer(user: { roleId: number }): void {
    if (user.roleId !== CUSTOMER_ROLE_ID) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
  }

  async adminRefresh(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    this.assertBackOfficeAccess(user);

    return this.buildTokens(user);
  }

  private assertBackOfficeAccess(user: { role: { rights: RightEnum[] } }): void {
    const canAccessBackOffice =
      user.role.rights.includes(RightEnum.ADMIN) ||
      user.role.rights.includes(RightEnum.CREATE_AD);

    if (!canAccessBackOffice) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits d'accès au back office.",
      );
    }
  }

  private buildTokens(user: { id: number; email: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: JWT_EXPIRES_IN,
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: JWT_REFRESH_EXPIRES_IN,
      }),
    };
  }
}
