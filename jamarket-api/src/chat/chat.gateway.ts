import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ChatService } from './chat.service';

type AuthenticatedSocket = Socket & {
  data: {
    userId?: number;
  };
};

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: (
      process.env.CORS_ORIGINS ?? 'http://localhost:4000,http://localhost:4200'
    )
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new WsException('Token manquant');
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, isActive: true, deletedAt: true },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new WsException('Compte inactif ou supprimé');
      }

      client.data.userId = user.id;
      this.logger.debug(`WS connecté: user=${user.id} sid=${client.id}`);
    } catch (error) {
      this.logger.warn(`WS connexion refusée: ${String(error)}`);
      client.emit('error', { message: 'Authentification WebSocket échouée' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(
      `WS déconnecté: user=${client.data.userId ?? '?'} sid=${client.id}`,
    );
  }

  @SubscribeMessage('joinConversation')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId: number },
  ) {
    const userId = this.requireUserId(client);
    const conversationId = Number(body?.conversationId);

    if (!conversationId || Number.isNaN(conversationId)) {
      throw new WsException('conversationId invalide');
    }

    const allowed = await this.chatService.assertUserIsParticipant(
      userId,
      conversationId,
    );
    if (!allowed) {
      throw new WsException('Accès refusé à cette conversation');
    }

    await client.join(this.roomName(conversationId));
    return { event: 'joined', data: { conversationId } };
  }

  @SubscribeMessage('leaveConversation')
  async handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId: number },
  ) {
    const conversationId = Number(body?.conversationId);
    if (conversationId) {
      await client.leave(this.roomName(conversationId));
    }
    return { event: 'left', data: { conversationId } };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId: number; text: string },
  ) {
    const userId = this.requireUserId(client);
    const conversationId = Number(body?.conversationId);

    if (!conversationId || Number.isNaN(conversationId)) {
      throw new WsException('conversationId invalide');
    }

    try {
      const message = await this.chatService.createMessage(
        userId,
        conversationId,
        body?.text ?? '',
      );

      this.server.to(this.roomName(conversationId)).emit('newMessage', message);

      return { event: 'messageSent', data: message };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Envoi du message impossible';
      throw new WsException(message);
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId: number; isTyping: boolean },
  ) {
    const userId = this.requireUserId(client);
    const conversationId = Number(body?.conversationId);

    if (!conversationId || Number.isNaN(conversationId)) {
      return;
    }

    const allowed = await this.chatService.assertUserIsParticipant(
      userId,
      conversationId,
    );
    if (!allowed) {
      return;
    }

    client.to(this.roomName(conversationId)).emit('userTyping', {
      conversationId,
      userId,
      isTyping: Boolean(body?.isTyping),
    });
  }

  private roomName(conversationId: number): string {
    return `conversation:${conversationId}`;
  }

  private requireUserId(client: AuthenticatedSocket): number {
    if (!client.data.userId) {
      throw new WsException('Non authentifié');
    }
    return client.data.userId;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    return null;
  }
}
