import React from 'react';
import { Server } from '../types';
import { Home, Plus, Compass } from 'lucide-react';

interface ServerListProps {
  servers: Server[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const ServerList: React.FC<ServerListProps> = ({ servers, activeId, onSelect }) => {
  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="w-[72px] bg-[#1E1F22] flex flex-col items-center py-3 space-y-2 overflow-y-auto no-scrollbar">
      {/* Discord Home Button */}
      <div 
        className="group relative flex justify-center w-full cursor-pointer"
        onClick={() => onSelect('home')}
      >
        <div className={`absolute left-0 bg-white rounded-r-lg transition-all duration-200 w-1 ${activeId === 'home' ? 'h-10 top-1.5' : 'h-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`}></div>
        <div className={`h-12 w-12 rounded-[24px] group-hover:rounded-[16px] flex items-center justify-center transition-all duration-200 ${activeId === 'home' ? 'bg-[#5865F2] text-white' : 'bg-[#313338] text-gray-400 group-hover:bg-[#5865F2] group-hover:text-white'}`}>
           <Home size={28} />
        </div>
      </div>

      <div className="w-8 h-[2px] bg-[#35363C] rounded-lg mx-auto my-1" />

      {servers.map((server) => (
        <div 
          key={server.id} 
          className="group relative flex justify-center w-full cursor-pointer"
          onClick={() => onSelect(server.id)}
        >
          <div className={`absolute left-0 bg-white rounded-r-lg transition-all duration-200 w-1 ${activeId === server.id ? 'h-10 top-1.5' : 'h-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`}></div>
          <div className={`h-12 w-12 rounded-[24px] group-hover:rounded-[16px] overflow-hidden transition-all duration-200 flex items-center justify-center bg-[#313338] text-[#dbdee1] text-xs font-medium hover:text-white ${activeId === server.id ? 'bg-[#5865F2]' : ''}`}>
            {server.icon ? (
              <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(server.name)}</span>
            )}
          </div>
        </div>
      ))}

      <div className="group flex justify-center w-full cursor-pointer mt-2">
        <div className="h-12 w-12 rounded-[24px] bg-[#313338] group-hover:bg-[#23A559] group-hover:text-white text-[#23A559] flex items-center justify-center transition-all duration-200">
          <Plus size={24} />
        </div>
      </div>

       <div className="group flex justify-center w-full cursor-pointer">
        <div className="h-12 w-12 rounded-[24px] bg-[#313338] group-hover:bg-[#23A559] group-hover:text-white text-[#23A559] flex items-center justify-center transition-all duration-200">
          <Compass size={24} />
        </div>
      </div>
    </div>
  );
};