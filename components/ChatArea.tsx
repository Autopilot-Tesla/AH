import React, { useEffect, useRef, useState } from 'react';
import { Channel, Message } from '../types';
import { Hash, PlusCircle, Gift, Sticker, Smile, Send } from 'lucide-react';

interface ChatAreaProps {
  channel: Channel;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ channel, messages, onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        onSendMessage(inputText);
        setInputText('');
      }
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338] min-w-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-[#26272D] shadow-sm shrink-0">
        <Hash className="text-[#80848E] mr-2" size={24} />
        <h3 className="font-bold text-white mr-4">{channel.name}</h3>
        <span className="text-[#949BA4] text-sm hidden sm:block truncate border-l border-[#3F4147] pl-4">
          This is the start of the #{channel.name} channel.
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-2 space-y-[1.0625rem]">
         {/* Welcome Placeholder */}
         <div className="mt-10 mb-8">
            <div className="h-16 w-16 bg-[#41434A] rounded-full flex items-center justify-center mb-4">
                <Hash size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to #{channel.name}!</h1>
            <p className="text-[#B5BAC1]">This is the start of the #{channel.name} channel.</p>
         </div>

        {messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          // Simple check to group messages. In a real app we'd check time diff too.
          const isGrouped = prevMsg && prevMsg.author.id === msg.author.id; 

          return (
            <div key={msg.id} className={`group flex ${isGrouped ? 'mt-[2px]' : 'mt-[17px]'} hover:bg-[#2e3035] -mx-4 px-4 py-0.5`}>
              {!isGrouped ? (
                <div className="w-10 h-10 rounded-full bg-gray-600 mr-4 shrink-0 overflow-hidden mt-0.5 cursor-pointer active:translate-y-[1px]">
                    <img src={msg.author.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={msg.author.username} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 mr-4 shrink-0 text-[10px] text-[#949BA4] opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                {!isGrouped && (
                  <div className="flex items-center mb-1">
                    <span className={`font-medium mr-2 hover:underline cursor-pointer ${msg.author.isBot ? 'text-white' : 'text-white'}`}>
                      {msg.author.username}
                    </span>
                    {msg.author.isBot && (
                      <span className="bg-[#5865F2] text-white text-[10px] px-1.5 rounded-[3px] py-[0.5px] mr-2 flex items-center">
                         <span className="mt-[1px]">APP</span>
                      </span>
                    )}
                    <span className="text-xs text-[#949BA4] ml-1">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`text-[#DBDEE1] whitespace-pre-wrap leading-[1.375rem] ${isGrouped ? '' : ''}`}>
                    {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
            <div className="flex items-center mt-2 pl-[3.5rem]">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#dbdee1] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#dbdee1] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#dbdee1] rounded-full animate-bounce"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 shrink-0">
        <div className="bg-[#383A40] rounded-lg px-4 py-2.5 flex items-center">
          <button className="text-[#B5BAC1] hover:text-[#dbdee1] mr-3 cursor-pointer p-1">
            <PlusCircle size={20} fill="#383A40" className="text-[#B5BAC1]" />
          </button>
          <input
            type="text"
            className="flex-1 bg-transparent text-[#dbdee1] outline-none placeholder-[#949BA4]"
            placeholder={`Message #${channel.name}`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center space-x-3 ml-2">
            <Gift size={20} className="text-[#B5BAC1] hover:text-[#dbdee1] cursor-pointer" />
            <Sticker size={20} className="text-[#B5BAC1] hover:text-[#dbdee1] cursor-pointer" />
            <Smile size={20} className="text-[#B5BAC1] hover:text-[#dbdee1] cursor-pointer" />
            {inputText.length > 0 && (
                 <Send size={20} className="text-[#B5BAC1] hover:text-white cursor-pointer" onClick={() => {
                     onSendMessage(inputText);
                     setInputText('');
                 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};