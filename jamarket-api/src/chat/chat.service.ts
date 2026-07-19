import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RightEnum } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

const CUSTOMER_ROLE_ID = 3;

const conversationListInclude = {
  ad: {
    select: {
      id: true,
      label: true,
      price: true,
      isActive: true,
      isSold: true,
      sellerId: true,
      vehicule: {
        select: {
          images: {
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
      lastName: true,
      avatarUrl: true,
      deletedAt: true,
    },
  },
  admin: {
    select: {
      id: true,
      name: true,
      lastName: true,
      avatarUrl: true,
      deletedAt: true,
    },
  },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: {
      id: true,
      text: true,
      senderId: true,
      createdAt: true,
    },
  },
};

const messageSenderSelect = {
  id: true,
  name: true,
  lastName: true,
  avatarUrl: true,
  deletedAt: true,
};

type PublicUserSource = {
  id: number;
  name: string;
  lastName: string;
  avatarUrl: string | null;
  deletedAt: Date | null;
};

export type AuthUser = {
  id: number;
  roleId: number;
  role: { rights: RightEnum[] };
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(user: AuthUser, dto: CreateConversationDto) {
    this.assertCustomer(user);

    const ad = await this.prisma.ad.findFirst({
      where: {
        id: dto.adId,
        deletedAt: null,
        isActive: true,
        isArchived: false,
      },
    });

    if (!ad) {
      throw new NotFoundException('Annonce introuvable');
    }

    if (!ad.sellerId) {
      throw new BadRequestException(
        'Cette annonce n’a pas de vendeur associé. Impossible d’ouvrir une conversation.',
      );
    }

    if (ad.sellerId === user.id) {
      throw new BadRequestException(
        'Vous ne pouvez pas contacter votre propre annonce.',
      );
    }

    const existing = await this.prisma.conversation.findUnique({
      where: {
        adId_customerId: {
          adId: ad.id,
          customerId: user.id,
        },
      },
    });

    if (existing) {
      if (dto.initialMessage?.trim()) {
        await this.prisma.message.create({
          data: {
            text: dto.initialMessage.trim(),
            conversationId: existing.id,
            senderId: user.id,
          },
        });
      }
      return this.getConversationForUser(user, existing.id);
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        adId: ad.id,
        customerId: user.id,
        adminId: ad.sellerId,
        ...(dto.initialMessage?.trim()
          ? {
              messages: {
                create: {
                  text: dto.initialMessage.trim(),
                  senderId: user.id,
                },
              },
            }
          : {}),
      },
    });

    return this.getConversationForUser(user, conversation.id);
  }

  async listConversations(user: AuthUser) {
    const where = this.buildListWhere(user);

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: conversationListInclude,
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map((c) => {
      const lastMessage = c.messages[0] ?? null;
      return {
        id: c.id,
        createdAt: c.createdAt,
        ad: {
          id: c.ad.id,
          label: c.ad.label,
          price: c.ad.price,
          isActive: c.ad.isActive,
          isSold: c.ad.isSold,
          imageUrl: c.ad.vehicule.images[0]?.url ?? null,
        },
        customer: this.mapPublicUser(c.customer),
        admin: this.mapPublicUser(c.admin),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,
      };
    });
  }

  async getConversationForUser(
    user: AuthUser,
    conversationId: number,
    options?: { limit?: number; offset?: number },
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ad: {
          select: {
            id: true,
            label: true,
            price: true,
            isActive: true,
            isSold: true,
            sellerId: true,
            vehicule: {
              select: {
                images: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            lastName: true,
            avatarUrl: true,
            deletedAt: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            lastName: true,
            avatarUrl: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    this.assertCanAccessConversation(user, conversation);

    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const [messages, totalMessages] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
        include: { sender: { select: messageSenderSelect } },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      ad: {
        id: conversation.ad.id,
        label: conversation.ad.label,
        price: conversation.ad.price,
        isActive: conversation.ad.isActive,
        isSold: conversation.ad.isSold,
        imageUrl: conversation.ad.vehicule.images[0]?.url ?? null,
      },
      customer: this.mapPublicUser(conversation.customer),
      admin: this.mapPublicUser(conversation.admin),
      messages: messages.map((m) => ({
        id: m.id,
        text: m.text,
        senderId: m.senderId,
        createdAt: m.createdAt,
        sender: this.mapPublicUser(m.sender),
      })),
      totalMessages,
    };
  }

  async assertUserIsParticipant(
    userId: number,
    conversationId: number,
  ): Promise<boolean> {
    const [conversation, user] = await Promise.all([
      this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { customerId: true, adminId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      }),
    ]);

    if (!conversation || !user || !user.isActive || user.deletedAt) {
      return false;
    }

    if (user.role.rights.includes(RightEnum.SUPER_ADMIN)) {
      return true;
    }

    return (
      conversation.customerId === userId || conversation.adminId === userId
    );
  }

  async createMessage(
    userId: number,
    conversationId: number,
    text: string,
  ) {
    const trimmed = text?.trim();
    if (!trimmed) {
      throw new BadRequestException('Le message ne peut pas être vide');
    }
    if (trimmed.length > 2000) {
      throw new BadRequestException(
        'Le message ne peut pas dépasser 2000 caractères',
      );
    }

    const [conversation, user] = await Promise.all([
      this.prisma.conversation.findUnique({
        where: { id: conversationId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      }),
    ]);

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    if (!user || !user.isActive || user.deletedAt) {
      throw new ForbiddenException('Compte inactif ou supprimé');
    }

    const isSuperAdmin = user.role.rights.includes(RightEnum.SUPER_ADMIN);
    const isParticipant =
      conversation.customerId === userId || conversation.adminId === userId;

    if (!isParticipant && !isSuperAdmin) {
      throw new ForbiddenException(
        'Vous n’êtes pas autorisé à écrire dans cette conversation',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        text: trimmed,
        conversationId,
        senderId: userId,
      },
      include: { sender: { select: messageSenderSelect } },
    });

    return {
      id: message.id,
      text: message.text,
      senderId: message.senderId,
      conversationId: message.conversationId,
      createdAt: message.createdAt,
      sender: this.mapPublicUser(message.sender),
    };
  }

  private buildListWhere(user: AuthUser) {
    const isSuperAdmin = user.role.rights.includes(RightEnum.SUPER_ADMIN);
    const isPro =
      user.role.rights.includes(RightEnum.CREATE_AD) ||
      user.role.rights.includes(RightEnum.ADMIN);

    if (user.roleId === CUSTOMER_ROLE_ID) {
      return { customerId: user.id };
    }

    if (isSuperAdmin) {
      return {};
    }

    if (isPro) {
      return { adminId: user.id };
    }

    throw new ForbiddenException(
      'Vous n’avez pas accès à la messagerie',
    );
  }

  private assertCustomer(user: AuthUser): void {
    if (user.roleId !== CUSTOMER_ROLE_ID) {
      throw new ForbiddenException(
        'Seul un client peut ouvrir une conversation depuis une annonce',
      );
    }
  }

  private assertCanAccessConversation(
    user: AuthUser,
    conversation: { customerId: number; adminId: number },
  ): void {
    const isSuperAdmin = user.role.rights.includes(RightEnum.SUPER_ADMIN);
    const isParticipant =
      conversation.customerId === user.id ||
      conversation.adminId === user.id;

    if (!isParticipant && !isSuperAdmin) {
      throw new ForbiddenException(
        'Vous n’êtes pas autorisé à accéder à cette conversation',
      );
    }
  }

  private mapPublicUser(user: PublicUserSource) {
    if (user.deletedAt) {
      return {
        id: user.id,
        name: 'Utilisateur',
        lastName: 'supprimé',
        avatarUrl: null,
        isDeleted: true,
      };
    }

    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isDeleted: false,
    };
  }
}
