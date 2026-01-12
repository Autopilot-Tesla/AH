import React, { useRef } from 'react';
import { Server, Channel, User, Category } from '../types';
import { Hash, Volume2, Mic, Headphones, Settings, PhoneOff } from 'lucide-react';
import { LiveVoiceClient } from '../services/liveService';

interface ChannelListProps {
  server: Server | null;
  channels: Channel[];
  categories: Category[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  currentUser: User;
  voiceConnected: boolean;
  setVoiceConnected: (status: boolean) => void;
  isHome?: boolean;
}

export const ChannelList: React.FC<ChannelListProps> = ({ 
  server, 
  channels, 
  categories,
  activeChannelId, 
  onSelectChannel,
  currentUser,
  voiceConnected,
  setVoiceConnected,
  isHome = false
}) => {
  const liveClient = useRef<LiveVoiceClient | null>(null);

  const handleVoiceJoin = async (channelId: string) => {
    if (voiceConnected) {
      liveClient.current?.disconnect();
      setVoiceConnected(false);
      return;
    }

    try {
      liveClient.current = new LiveVoiceClient();
      await liveClient.current.connect(() => setVoiceConnected(false));
      setVoiceConnected(true);
      onSelectChannel(channelId);
    } catch (e) {
      console.error(e);
      alert("Could not connect to voice. Check API Key and Microphone permissions.");
    }
  };

  // Render Direct Messages (Home View)
  const renderDMs = () => {
    return (
      <div className="flex-1 overflow-y-auto px-2 pt-3 space-y-1 custom-scrollbar">
         <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-[#949BA4] uppercase">
            <span>Direct Messages</span>
         </div>
         {channels.map(channel => {
           const isActive = activeChannelId === channel.id;
           const recipient = channel.recipients?.[0];
           const name = recipient ? recipient.username : channel.name;
           const avatar = recipient?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';

           return (
             <div
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`group flex items-center px-2 py-1.5 rounded-[4px] cursor-pointer transition-colors ${
                  isActive ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#dbdee1]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-600 mr-3 overflow-hidden">
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                </div>
                <span className="truncate font-medium flex-1">{name}</span>
             </div>
           );
         })}
      </div>
    );
  };

  // Group channels by category (Server View)
  const renderChannels = () => {
    // 1. Channels with no category
    const noCatChannels = channels.filter(c => !c.categoryId);
    
    // 2. Channels with category
    const catGroups = categories.map(cat => ({
      ...cat,
      channels: channels.filter(c => c.categoryId === cat.id)
    }));

    return (
      <div className="flex-1 overflow-y-auto px-2 pt-3 space-y-4 custom-scrollbar">
        {noCatChannels.length > 0 && (
          <div className="space-y-0.5">
             {noCatChannels.map(channel => renderChannelItem(channel))}
          </div>
        )}
        
        {catGroups.map(group => {
           if (group.channels.length === 0) return null;
           return (
             <div key={group.id}>
                <div className="flex items-center justify-between px-2 mb-1 text-xs font-bold text-[#949BA4] uppercase hover:text-[#dbdee1] cursor-pointer">
                  <span className="flex items-center">
                    <span className="mr-0.5">v</span> {group.name}
                  </span>
                </div>
                <div className="space-y-0.5">
                   {group.channels.map(channel => renderChannelItem(channel))}
                </div>
             </div>
           );
        })}
      </div>
    );
  };

  const renderChannelItem = (channel: Channel) => {
    const isVoice = channel.type === 'voice';
    const isActive = activeChannelId === channel.id;
    
    return (
      <div
        key={channel.id}
        onClick={() => isVoice ? handleVoiceJoin(channel.id) : onSelectChannel(channel.id)}
        className={`group flex items-center px-2 py-1.5 rounded-[4px] cursor-pointer transition-colors ${
          isActive || (isVoice && voiceConnected && isActive) 
            ? 'bg-[#404249] text-white' 
            : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#dbdee1]'
        }`}
      >
        {isVoice ? (
           <Volume2 size={20} className="mr-1.5 text-[#949BA4]" />
        ) : (
           <Hash size={20} className="mr-1.5 text-[#949BA4]" />
        )}
        <span className={`truncate font-medium ${isVoice && voiceConnected && isActive ? 'text-[#23a559]' : ''}`}>
            {channel.name}
        </span>
      </div>
    );
  };

  return (
    <div className="w-60 bg-[#2B2D31] flex flex-col">
      {/* Server Header or Search Bar for DM */}
      <div className="h-12 border-b border-[#1F2023] flex items-center px-4 font-bold text-white shadow-sm hover:bg-[#35373C] cursor-pointer transition-colors">
        <h1 className="truncate">{isHome ? 'Find or start a conversation' : server?.name}</h1>
      </div>

      {isHome ? renderDMs() : renderChannels()}

      {/* Voice Status Panel */}
      {voiceConnected && (
        <div className="bg-[#232428] p-2 border-b border-[#1F2023]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-[#23a559] text-xs font-bold">Voice Connected</span>
               <span className="text-[#dbdee1] text-xs">Gemini Voice / {server?.name || 'DM'}</span>
            </div>
             <button onClick={() => handleVoiceJoin('')} className="p-2 hover:bg-[#35373C] rounded">
                <PhoneOff size={18} className="text-white" />
             </button>
          </div>
        </div>
      )}

      {/* User Control Panel */}
      <div className="bg-[#232428] px-2 py-1.5 flex items-center justify-between mt-auto">
        <div className="flex items-center hover:bg-[#3F4147] p-1 rounded cursor-pointer -ml-1 mr-1">
          <div className="relative mr-2">
             <img src={currentUser.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="User" className="w-8 h-8 rounded-full bg-gray-600" />
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#23A559] border-2 border-[#232428] rounded-full"></div>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-white leading-tight w-20 truncate">{currentUser.username}</div>
            <div className="text-xs text-[#949BA4] leading-tight">#{currentUser.discriminator}</div>
          </div>
        </div>
        <div className="flex items-center">
            <button className="p-1.5 hover:bg-[#3F4147] rounded cursor-pointer text-gray-200">
                <Mic size={18} />
            </button>
            <button className="p-1.5 hover:bg-[#3F4147] rounded cursor-pointer text-gray-200">
                <Headphones size={18} />
            </button>
            <button className="p-1.5 hover:bg-[#3F4147] rounded cursor-pointer text-gray-200">
                <Settings size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};