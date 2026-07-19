import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { ImageProcessingService } from '../upload/image-processing.service';
import { AuthService } from './auth.service';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      findFirst: vi.fn(),
    },
  };

  const jwtService = {
    sign: vi.fn(),
  };

  const imageProcessing = {};

  const customerRole = { id: 3, label: 'Customer' };

  const customerUser = {
    id: 10,
    email: 'acheteur@example.com',
    password: 'hashed-password',
    name: 'Alice',
    lastName: 'Martin',
    roleId: 3,
    isActive: true,
    deletedAt: null,
    role: customerRole,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    jwtService.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ImageProcessingService, useValue: imageProcessing },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    const registerDto = {
      name: 'Alice',
      lastName: 'Martin',
      email: 'acheteur@example.com',
      password: 'MotDePasse1!',
    };

    it('inscrit un client et retourne les tokens JWT', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(customerRole);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      prisma.user.create.mockResolvedValue(customerUser);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.name,
          lastName: registerDto.lastName,
          email: registerDto.email,
          password: 'hashed-password',
          roleId: customerRole.id,
        },
        include: { role: true },
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('rejette un email déjà utilisé', async () => {
      prisma.user.findUnique.mockResolvedValue(customerUser);

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'acheteur@example.com',
      password: 'MotDePasse1!',
    };

    it('authentifie un client et retourne les tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(customerUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: customerUser.id, email: customerUser.email },
        expect.objectContaining({ secret: 'test-access-secret' }),
      );
    });

    it('rejette un mauvais mot de passe', async () => {
      prisma.user.findUnique.mockResolvedValue(customerUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('rejette un compte inactif ou soft-deleted', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...customerUser,
        isActive: false,
        deletedAt: new Date(),
      });

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });
});
