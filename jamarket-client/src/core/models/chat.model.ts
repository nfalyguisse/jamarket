export interface ChatUserPublic {
  id: number;
  name: string;
  lastName: string;
  avatarUrl: string | null;
  isDeleted: boolean;
}

export interface ConversationAdSummary {
  id: number;
  label: string;
  price: number;
  isActive: boolean;
  isSold: boolean;
  imageUrl: string | null;
}

export interface ConversationLastMessage {
  id: number;
  text: string;
  senderId: number;
  createdAt: string;
}

export interface ConversationSummary {
  id: number;
  createdAt: string;
  ad: ConversationAdSummary;
  customer: ChatUserPublic;
  admin: ChatUserPublic;
  lastMessage: ConversationLastMessage | null;
}

export interface ChatMessage {
  id: number;
  text: string;
  senderId: number;
  conversationId?: number;
  createdAt: string;
  sender: ChatUserPublic;
}

export interface ConversationDetail {
  id: number;
  createdAt: string;
  ad: ConversationAdSummary;
  customer: ChatUserPublic;
  admin: ChatUserPublic;
  messages: ChatMessage[];
  totalMessages: number;
}

export interface CreateConversationPayload {
  adId: number;
  initialMessage?: string;
}

export interface UserTypingEvent {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}
