import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 10;
const DEFAULT_CUSTOMER_ROLE_LABEL = 'Customer';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.buildTokens(user);
  }

  async refresh(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return this.buildTokens(user);
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
      omit: { password: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur introuvable');
    }

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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const anonymizedEmail = `deleted_${userId}@supprime.jamarket`;

    await this.prisma.$transaction(async (tx) => {
      await tx.favorite.deleteMany({ where: { userId } });

      await tx.ad.updateMany({
        where: { sellerId: userId, deletedAt: null },
        data: { deletedAt: new Date(), isActive: false },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          name: 'Utilisateur',
          lastName: 'Supprimé',
          email: anonymizedEmail,
          password: '',
          isActive: false,
          deletedAt: new Date(),
        },
      });
    });
  }

  private buildTokens(user: { id: number; email: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    };
  }
}
