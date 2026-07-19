import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RightEnum } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser, ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';

interface AuthRequest {
  user: AuthUser & {
    role: { rights: RightEnum[] };
  };
}

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({
    summary: 'Ouvrir ou réouvrir une conversation liée à une annonce',
    description:
      'Réservé aux clients. Crée une conversation unique (annonce × client) ' +
      'avec le vendeur de l’annonce (adminId = sellerId), ou réouvre le fil existant.',
  })
  @ApiResponse({ status: 201, description: 'Conversation créée ou réouverte' })
  @ApiResponse({ status: 400, description: 'Annonce sans vendeur ou message invalide' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Seuls les clients peuvent créer une conversation' })
  @ApiResponse({ status: 404, description: 'Annonce introuvable' })
  create(
    @Body() dto: CreateConversationDto,
    @Request() req: AuthRequest,
  ) {
    return this.chatService.createConversation(req.user, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les conversations de l’utilisateur connecté',
    description:
      'Client : ses conversations. Vendeur : leads où il est adminId. ' +
      'Super-admin : toutes les conversations.',
  })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  list(@Request() req: AuthRequest) {
    return this.chatService.listConversations(req.user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail d’une conversation avec historique des messages',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation et messages' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListMessagesQueryDto,
    @Request() req: AuthRequest,
  ) {
    return this.chatService.getConversationForUser(req.user, id, {
      limit: query.limit,
      offset: query.offset,
    });
  }
}
