import React from 'react';

const ONLINE_USERS = [
  { id: '1', name: 'Gemini', avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg', isBot: true, status: 'online' },
  { id: '2', name: 'React Expert', avatar: 'https://picsum.photos/id/10/200/200', isBot: true, status: 'online' },
  { id: '3', name: 'Moderator', avatar: 'https://picsum.photos/id/64/200/200', isBot: false, status: 'idle' },
];

const OFFLINE_USERS = [
    { id: '4', name: 'Gamer123', avatar: 'https://picsum.photos/id/70/200/200', isBot: false, status: 'offline' },
    { id: '5', name: 'DevOps', avatar: 'https://picsum.photos/id/90/200/200', isBot: false, status: 'offline' },
];

export const UserList: React.FC = () => {
  return (
    <div className="w-60 bg-[#2B2D31] hidden lg:flex flex-col overflow-y-auto p-4 custom-scrollbar shrink-0">
      
      <div className="mb-6">
        <h3 className="text-[#949BA4] text-xs font-bold uppercase mb-2 px-2">Online — {ONLINE_USERS.length}</h3>
        <div className="space-y-0.5">
          {ONLINE_USERS.map(user => (
            <div key={user.id} className="flex items-center px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer opacity-100 group">
              <div className="relative mr-3">
                 <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                 </div>
                 <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-[#2B2D31] rounded-full ${user.status === 'online' ? 'bg-[#23A559]' : 'bg-[#F0B232]'}`}></div>
              </div>
              <div className="flex flex-col">
                 <div className="flex items-center">
                    <span className={`font-medium text-${user.isBot ? 'white' : '[#949BA4]'} group-hover:text-[#dbdee1]`}>{user.name}</span>
                    {user.isBot && <span className="ml-1.5 bg-[#5865F2] text-white text-[10px] px-1.5 rounded py-[1px]">BOT</span>}
                 </div>
                 {user.isBot && <div className="text-xs text-[#949BA4]">Thinking...</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[#949BA4] text-xs font-bold uppercase mb-2 px-2">Offline — {OFFLINE_USERS.length}</h3>
        <div className="space-y-0.5">
          {OFFLINE_USERS.map(user => (
            <div key={user.id} className="flex items-center px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer opacity-50 hover:opacity-100 group">
               <div className="relative mr-3">
                 <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden grayscale">
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                 </div>
                 <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-[#2B2D31] rounded-full bg-[#80848E]"></div>
              </div>
              <div className="font-medium text-[#949BA4] group-hover:text-[#dbdee1]">{user.name}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};