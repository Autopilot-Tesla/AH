import { Server, Channel, Category, Message, User } from './types';

export const INITIAL_SERVERS: Server[] = [
  { id: '1', name: 'Gemini Hub', icon: 'https://picsum.photos/id/40/200/200' },
  { id: '2', name: 'React Developers', icon: 'https://picsum.photos/id/10/200/200' },
  { id: '3', name: 'Gaming Lounge', icon: 'https://picsum.photos/id/50/200/200' },
];

export const INITIAL_CHANNELS: Channel[] = [
  { id: 'welcome', name: 'welcome', type: 'text', categoryId: 'info' },
  { id: 'announcements', name: 'announcements', type: 'text', categoryId: 'info' },
  { id: 'general', name: 'general', type: 'text', categoryId: 'chat' },
  { id: 'coding-help', name: 'coding-help', type: 'text', categoryId: 'chat' },
  { id: 'memes', name: 'memes', type: 'text', categoryId: 'chat' },
  { id: 'voice-general', name: 'General', type: 'voice', categoryId: 'voice' },
];

const BOT_USER: User = {
  id: 'gemini-bot',
  username: 'Gemini',
  discriminator: '0000',
  avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
  status: 'online',
  isBot: true
};

export const INITIAL_DMS: Channel[] = [
  { 
    id: 'dm-1', 
    name: 'Gemini', 
    type: 'dm',
    recipients: [BOT_USER]
  }
];

export const CATEGORIES: Category[] = [
  { id: 'info', name: 'Information' },
  { id: 'chat', name: 'Text Channels' },
  { id: 'voice', name: 'Voice Channels' },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  'general': [
    {
      id: '1',
      content: 'Welcome to the server! I am your AI assistant running on the Gemini API.',
      author: BOT_USER,
      timestamp: new Date(Date.now() - 100000).toISOString(),
      channelId: 'general'
    }
  ],
  'dm-1': [
    {
      id: 'dm-msg-1',
      content: 'Hello! I am Gemini. You can DM me here privately.',
      author: BOT_USER,
      timestamp: new Date().toISOString(),
      channelId: 'dm-1'
    }
  ]
};