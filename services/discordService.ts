import { User, Server, Channel, Message } from '../types';

const BASE_URL = 'https://discord.com/api/v9';

// Headers for Discord Requests
const getHeaders = (token: string) => ({
  'Authorization': token,
  'Content-Type': 'application/json',
});

// Helper to wrap fetches with Proxy if provided
const fetchWithProxy = async (url: string, token: string, proxyUrl: string = '') => {
  const targetUrl = proxyUrl ? `${proxyUrl}${url}` : url;
  const response = await fetch(targetUrl, {
    headers: getHeaders(token)
  });
  
  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid Token");
    if (response.status === 403) throw new Error("Access Denied (CORS or Permissions)");
    throw new Error(`Discord API Error: ${response.status}`);
  }
  return response.json();
};

export const fetchCurrentUser = async (token: string, proxyUrl: string): Promise<User> => {
  const data = await fetchWithProxy(`${BASE_URL}/users/@me`, token, proxyUrl);
  return {
    id: data.id,
    username: data.username,
    discriminator: data.discriminator,
    avatar: data.avatar 
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` 
      : 'https://cdn.discordapp.com/embed/avatars/0.png',
    status: 'online'
  };
};

export const fetchGuilds = async (token: string, proxyUrl: string): Promise<Server[]> => {
  const data = await fetchWithProxy(`${BASE_URL}/users/@me/guilds`, token, proxyUrl);
  return data.map((g: any) => ({
    id: g.id,
    name: g.name,
    icon: g.icon 
      ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` 
      : null,
    isReal: true
  }));
};

export const fetchChannels = async (guildId: string, token: string, proxyUrl: string): Promise<{channels: Channel[], categories: any[]}> => {
  const data = await fetchWithProxy(`${BASE_URL}/guilds/${guildId}/channels`, token, proxyUrl);
  
  const categories = data.filter((c: any) => c.type === 4).map((c: any) => ({
    id: c.id,
    name: c.name,
    position: c.position
  })).sort((a: any, b: any) => a.position - b.position);

  const channels = data.filter((c: any) => c.type === 0 || c.type === 2).map((c: any) => ({
    id: c.id,
    name: c.name,
    type: c.type === 2 ? 'voice' : 'text',
    categoryId: c.parent_id,
    position: c.position
  })).sort((a: any, b: any) => a.position - b.position);

  return { channels, categories };
};

export const fetchDirectMessages = async (token: string, proxyUrl: string): Promise<Channel[]> => {
  // DM Channels (Type 1)
  const data = await fetchWithProxy(`${BASE_URL}/users/@me/channels`, token, proxyUrl);
  return data.map((c: any) => ({
    id: c.id,
    type: 'dm',
    name: c.recipients ? c.recipients.map((r: any) => r.username).join(', ') : 'Unknown',
    recipients: c.recipients?.map((r: any) => ({
      id: r.id,
      username: r.username,
      discriminator: r.discriminator,
      avatar: r.avatar ? `https://cdn.discordapp.com/avatars/${r.id}/${r.avatar}.png` : null
    }))
  }));
};

export const fetchMessages = async (channelId: string, token: string, proxyUrl: string): Promise<Message[]> => {
  const data = await fetchWithProxy(`${BASE_URL}/channels/${channelId}/messages?limit=50`, token, proxyUrl);
  
  return data.reverse().map((m: any) => ({
    id: m.id,
    content: m.content,
    author: {
      id: m.author.id,
      username: m.author.username,
      discriminator: m.author.discriminator,
      avatar: m.author.avatar 
        ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png` 
        : 'https://cdn.discordapp.com/embed/avatars/0.png',
      isBot: m.author.bot
    },
    timestamp: m.timestamp,
    channelId: channelId
  }));
};

export const sendMessage = async (channelId: string, content: string, token: string, proxyUrl: string) => {
  const url = proxyUrl ? `${proxyUrl}${BASE_URL}/channels/${channelId}/messages` : `${BASE_URL}/channels/${channelId}/messages`;
  
  await fetch(url, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ content })
  });
};