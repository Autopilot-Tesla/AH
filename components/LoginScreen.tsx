import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string, token?: string, proxy?: string) => void;
  isLoading: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading }) => {
  const [mode, setMode] = useState<'ai' | 'discord'>('ai');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [proxy, setProxy] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'ai' && username.trim()) {
      onLogin(username);
    } else if (mode === 'discord' && token.trim()) {
      onLogin('', token, proxy);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#313338] flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://cdn.discordapp.com/attachments/1083431668858728562/1155093751714856990/discord_login_bg.png')] bg-cover opacity-100"></div>
      
      <div className="bg-[#313338] p-8 rounded-[5px] shadow-2xl w-full max-w-[784px] z-10 flex flex-row animate-fade-in-up items-center">
        
        {/* Left Side: Form */}
        <div className="flex-1 pr-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
            <p className="text-[#B5BAC1]">We're so excited to see you again!</p>
          </div>

          {/* Mode Switcher */}
          <div className="bg-[#2B2D31] p-1 rounded mb-6 flex">
            <button 
              onClick={() => setMode('ai')}
              className={`flex-1 py-1 text-sm font-bold rounded transition-colors ${mode === 'ai' ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#dbdee1]'}`}
            >
              Simulated (AI)
            </button>
            <button 
              onClick={() => setMode('discord')}
              className={`flex-1 py-1 text-sm font-bold rounded transition-colors ${mode === 'discord' ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#dbdee1]'}`}
            >
              Real Discord
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'ai' ? (
              <div className="mb-4">
                <label className="block text-[#B5BAC1] text-xs font-bold uppercase mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1E1F22] text-white p-2.5 rounded-[3px] outline-none border-none focus:ring-0 font-light"
                  required
                />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-[#B5BAC1] text-xs font-bold uppercase mb-2">
                    User Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full bg-[#1E1F22] text-white p-2.5 rounded-[3px] outline-none border-none focus:ring-0 font-light"
                    placeholder="Discord User Token"
                    required
                  />
                  <div className="text-[#00A8FC] text-xs mt-1 cursor-pointer hover:underline">
                    Warning: Never share your token. Use at your own risk.
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-[#B5BAC1] text-xs font-bold uppercase mb-2">
                    CORS Proxy URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={proxy}
                    onChange={(e) => setProxy(e.target.value)}
                    className="w-full bg-[#1E1F22] text-white p-2.5 rounded-[3px] outline-none border-none focus:ring-0 font-light"
                    placeholder="https://your-cors-proxy.com/"
                  />
                  <div className="text-[#949BA4] text-[10px] mt-1">
                    Required for browser-based access. Try 'https://corsproxy.io/?' if blocked.
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2.5 rounded-[3px] transition-colors mb-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Connecting...' : (mode === 'ai' ? 'Start AI Chat' : 'Login to Discord')}
            </button>
            
            <div className="text-sm text-[#949BA4]">
              Need an account? <span className="text-[#00A8FC] cursor-pointer hover:underline">Register</span>
            </div>
          </form>
        </div>

        {/* Right Side: QR Code (Visual Only) */}
        <div className="hidden md:flex flex-col items-center justify-center pl-8 border-l border-[#3F4147] w-[240px]">
           <div className="w-[176px] h-[176px] bg-white rounded-lg p-2 mb-6 flex items-center justify-center">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://discord.com" alt="QR Code" />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Log in with QR Code</h3>
           <p className="text-[#B5BAC1] text-center text-sm">Scan this with the <strong>Discord mobile app</strong> to log in instantly.</p>
        </div>

      </div>
    </div>
  );
};