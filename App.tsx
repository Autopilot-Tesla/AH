import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ServerList } from './components/ServerList';
import { ChannelList } from './components/ChannelList';
import { ChatArea } from './components/ChatArea';
import { UserList } from './components/UserList';
import { User, Channel, Message, Server, Category } from './types';
import { INITIAL_SERVERS, INITIAL_CHANNELS, INITIAL_MESSAGES, CATEGORIES as INITIAL_CATEGORIES, INITIAL_DMS } from './constants';
import { generateAIResponse } from './services/geminiService';
import * as DiscordService from './services/discordService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [discordToken, setDiscordToken] = useState<string>('');
  const [proxyUrl, setProxyUrl] = useState<string>('');
  
  const [servers, setServers] = useState<Server[]>(INITIAL_SERVERS);
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [directMessages, setDirectMessages] = useState<Channel[]>(INITIAL_DMS);
  
  const [activeServerId, setActiveServerId] = useState<string>('home'); // Start at home
  const [activeChannelId, setActiveChannelId] = useState<string>(INITIAL_DMS[0].id);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  
  const [isLoading, setIsLoading] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);

  // Load state
  useEffect(() => {
    const storedUser = localStorage.getItem('discord_ai_user');
    const storedToken = localStorage.getItem('discord_token');
    const storedProxy = localStorage.getItem('discord_proxy');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedToken) setDiscordToken(storedToken);
    if (storedProxy) setProxyUrl(storedProxy);
  }, []);

  // Fetch real discord data when server/mode changes
  useEffect(() => {
    const loadRealData = async () => {
      setIsLoading(true);
      try {
        if (activeServerId === 'home') {
            // LOAD DIRECT MESSAGES
            if (discordToken) {
                const dms = await DiscordService.fetchDirectMessages(discordToken, proxyUrl);
                setDirectMessages(dms);
                // If current channel is not in new DMs, switch to first one
                if (dms.length > 0 && !dms.find(c => c.id === activeChannelId)) {
                    setActiveChannelId(dms[0].id);
                }
            } else {
                setDirectMessages(INITIAL_DMS);
            }
        } else {
            // LOAD SERVER CHANNELS
            const activeServer = servers.find(s => s.id === activeServerId);
            if (activeServer?.isReal && discordToken) {
              const { channels: realChannels, categories: realCategories } = await DiscordService.fetchChannels(activeServerId, discordToken, proxyUrl);
              setChannels(realChannels);
              setCategories(realCategories);
              if (realChannels.length > 0) setActiveChannelId(realChannels[0].id);
            } else if (!activeServer?.isReal) {
              // Reset to AI Data
              setChannels(INITIAL_CHANNELS);
              setCategories(INITIAL_CATEGORIES);
              if (!INITIAL_CHANNELS.find(c => c.id === activeChannelId)) {
                   setActiveChannelId(INITIAL_CHANNELS[0].id);
              }
            }
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadRealData();
  }, [activeServerId, servers, discordToken, proxyUrl]);

  // Fetch real messages when channel changes
  useEffect(() => {
    const activeServer = servers.find(s => s.id === activeServerId);
    const isRealServer = activeServer?.isReal;
    const isHome = activeServerId === 'home';
    const isRealMode = !!discordToken;
    
    if ((isRealServer || (isHome && isRealMode)) && activeChannelId) {
       const loadMessages = async () => {
         setIsLoading(true);
         try {
           const msgs = await DiscordService.fetchMessages(activeChannelId, discordToken, proxyUrl);
           setMessages(prev => ({ ...prev, [activeChannelId]: msgs }));
         } catch (e) {
           console.error("Failed to fetch messages", e);
         } finally {
           setIsLoading(false);
         }
       };
       loadMessages();
       const interval = setInterval(loadMessages, 5000);
       return () => clearInterval(interval);
    }
  }, [activeChannelId, activeServerId, discordToken, proxyUrl]);


  const handleLogin = async (username: string, token?: string, proxy?: string) => {
    if (token) {
       try {
         setIsLoading(true);
         const discordUser = await DiscordService.fetchCurrentUser(token, proxy || '');
         const guilds = await DiscordService.fetchGuilds(token, proxy || '');
         
         setUser(discordUser);
         setDiscordToken(token);
         setProxyUrl(proxy || '');
         setServers(guilds); // Replace initial servers with real ones
         
         localStorage.setItem('discord_ai_user', JSON.stringify(discordUser));
         localStorage.setItem('discord_token', token);
         if (proxy) localStorage.setItem('discord_proxy', proxy);

       } catch (e) {
         alert("Failed to login to Discord. Check Token or Proxy.");
         return;
       } finally {
         setIsLoading(false);
       }
    } else {
       // AI Only Mode
       const newUser: User = {
        id: 'user-' + Date.now(),
        username,
        discriminator: Math.floor(1000 + Math.random() * 9000).toString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        status: 'online'
      };
      localStorage.setItem('discord_ai_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!user) return;
    const activeServer = servers.find(s => s.id === activeServerId);
    const isRealServer = activeServer?.isReal;
    const isHome = activeServerId === 'home';

    // 1. Real Discord Send
    if ((isRealServer || (isHome && discordToken)) && discordToken) {
       try {
         await DiscordService.sendMessage(activeChannelId, text, discordToken, proxyUrl);
         // Optimistic update
         const newMessage: Message = {
            id: 'temp-' + Date.now(),
            content: text,
            author: user,
            timestamp: new Date().toISOString(),
            channelId: activeChannelId
         };
         setMessages(prev => ({
            ...prev,
            [activeChannelId]: [...(prev[activeChannelId] || []), newMessage]
         }));
       } catch (e) {
         console.error("Failed to send real message", e);
         alert("Failed to send message.");
       }
       return;
    }

    // 2. AI Chat Send (Gemini)
    const newMessage: Message = {
      id: Date.now().toString(),
      content: text,
      author: user,
      timestamp: new Date().toISOString(),
      channelId: activeChannelId
    };

    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMessage]
    }));

    setIsLoading(true);

    try {
      const activeChannel = activeServerId === 'home' 
        ? directMessages.find(c => c.id === activeChannelId) 
        : channels.find(c => c.id === activeChannelId);
        
      const history = messages[activeChannelId] || [];
      const contextName = activeChannel?.name || 'general';
      
      const aiResponseText = await generateAIResponse(text, contextName, history);

      const botUser: User = {
        id: 'gemini-bot',
        username: 'Gemini',
        discriminator: '0000',
        avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
        status: 'online',
        isBot: true
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        author: botUser,
        timestamp: new Date().toISOString(),
        channelId: activeChannelId
      };

      setMessages(prev => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), aiMessage]
      }));

    } catch (error) {
      console.error("Failed to get AI response", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} isLoading={isLoading} />;
  }

  const isHome = activeServerId === 'home';
  const activeServer = isHome ? null : (servers.find(s => s.id === activeServerId) || servers[0]);
  
  // Decide which list to pass to ChatArea/ChannelList
  const currentChannelList = isHome ? directMessages : channels;
  const activeChannel = currentChannelList.find(c => c.id === activeChannelId) || currentChannelList[0];
  const currentMessages = messages[activeChannelId] || [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#313338] text-[#dbdee1] font-sans">
      <ServerList 
        servers={servers} 
        activeId={activeServerId} 
        onSelect={setActiveServerId} 
      />
      <ChannelList 
        server={activeServer} 
        channels={currentChannelList} 
        categories={categories}
        activeChannelId={activeChannelId} 
        onSelectChannel={setActiveChannelId}
        currentUser={user}
        voiceConnected={voiceConnected}
        setVoiceConnected={setVoiceConnected}
        isHome={isHome}
      />
      <div className="flex flex-1 flex-row min-w-0">
        <ChatArea 
          channel={activeChannel} 
          messages={currentMessages} 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
        <UserList />
      </div>
    </div>
  );
}