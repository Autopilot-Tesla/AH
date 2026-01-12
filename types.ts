export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null; // Allow null for default avatars
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  isBot?: boolean;
}

export interface Message {
  id: string;
  content: string;
  author: User;
  timestamp: string;
  channelId: string;
  attachments?: any[];
  embeds?: any[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'dm' | 0 | 1 | 2; // 0=GUILD_TEXT, 1=DM, 2=GUILD_VOICE
  categoryId?: string;
  position?: number;
  recipients?: User[]; // For Direct Messages
}

export interface Server {
  id: string;
  name: string;
  icon: string | null;
  isReal?: boolean; // Flag to distinguish Real Discord vs AI
}

export interface Category {
  id: string;
  name: string;
  position?: number;
}

export interface DiscordState {
  token: string;
  proxyUrl: string;
}