// Simple single-file "converted" app (vanilla JS). No build step needed.
// Save this as app.js next to index.html.

(() => {
  // -------------------------
  // Constants / Initial Data
  // -------------------------
  const INITIAL_SERVERS = [
    { id: 'home', name: 'Home', isReal: false },
    { id: 'ai-server', name: 'AI Server', isReal: false }
  ];

  const INITIAL_CHANNELS = [
    { id: 'general', name: 'general', type: 'text' },
    { id: 'random', name: 'random', type: 'text' },
    { id: 'voice-1', name: 'Voice Channel', type: 'voice' }
  ];

  const CATEGORIES = [
    { id: 'cat-1', name: 'Text Channels' }
  ];

  const INITIAL_DMS = [
    { id: 'dm-1', name: 'Gemini DM', type: 'dm', recipients: [{ id: 'gemini', username: 'Gemini', avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg', isBot: true }] }
  ];

  const INITIAL_MESSAGES = {
    'general': [
      {
        id: 'm1',
        content: 'Welcome to the general channel (AI demo).',
        author: { id: 'system', username: 'System', isBot: true, avatar: '' },
        timestamp: new Date().toISOString(),
        channelId: 'general'
      }
    ],
    'dm-1': [
      {
        id: 'dm1',
        content: 'Hello! Send me a message to see AI responses.',
        author: { id: 'gemini', username: 'Gemini', isBot: true, avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' },
        timestamp: new Date().toISOString(),
        channelId: 'dm-1'
      }
    ]
  };

  // -------------------------
  // Simple helpers
  // -------------------------
  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') node.className = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      } else {
        node.setAttribute(k, attrs[k]);
      }
    }
    children.forEach(c => {
      if (c === null || c === undefined) return;
      if (typeof c === 'string' || typeof c === 'number') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  };

  function formatTime(isoString){
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    if (isToday) return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' });
  }

  // -------------------------
  // State
  // -------------------------
  const state = {
    user: null,
    discordToken: '',
    proxyUrl: '',
    servers: [...INITIAL_SERVERS],
    channels: [...INITIAL_CHANNELS],
    categories: [...CATEGORIES],
    directMessages: [...INITIAL_DMS],
    activeServerId: 'home',
    activeChannelId: INITIAL_DMS[0].id,
    messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),
    isLoading: false,
    voiceConnected: false
  };

  // Persist/load
  try {
    const storedUser = localStorage.getItem('discord_ai_user');
    const storedToken = localStorage.getItem('discord_token');
    const storedProxy = localStorage.getItem('discord_proxy');
    if (storedUser) state.user = JSON.parse(storedUser);
    if (storedToken) state.discordToken = storedToken;
    if (storedProxy) state.proxyUrl = storedProxy;
  } catch (e) {
    console.warn('localStorage read failed', e);
  }

  // -------------------------
  // Discord helpers (browser)
  // -------------------------
  function withProxy(url, proxy) {
    if (!proxy) return url;
    // Many simple proxies expect the target URL in a query param; encode it.
    // Example: https://corsproxy.io/?https://discord.com/api/...
    // If user provided a proxy that already expects encoding, this simple prefixing works for many proxies.
    if (proxy.includes('?')) return proxy + encodeURIComponent(url);
    return proxy + url;
  }

  async function discordFetch(path, token, proxy, opts = {}) {
    const url = path.startsWith('http') ? path : `https://discord.com/api/v10${path}`;
    const fetchUrl = withProxy(url, proxy);
    const headers = Object.assign({}, opts.headers || {});
    if (token) headers['Authorization'] = token;
    if (!headers['Content-Type'] && opts.body) headers['Content-Type'] = 'application/json';
    const res = await fetch(fetchUrl, { ...opts, headers });
    if (!res.ok) {
      const txt = await res.text().catch(()=>'');
      throw new Error(`Discord API error ${res.status} ${txt}`);
    }
    return res.json().catch(()=>null);
  }

  async function tryFetchUserAndGuilds(token, proxy) {
    const user = await discordFetch('/users/@me', token, proxy);
    const guilds = await discordFetch('/users/@me/guilds', token, proxy);
    return { user, guilds };
  }

  // -------------------------
  // Simulated Gemini AI
  // -------------------------
  async function generateAIResponse(userMessage, contextName, history) {
    // Simulate latency
    await new Promise(r => setTimeout(r, 700));
    return `Gemini (simulated): I received "${userMessage}" in ${contextName}.`;
  }

  // -------------------------
  // Rendering
  // -------------------------
  const root = document.getElementById('root');

  function clearNode(n){ while(n.firstChild) n.removeChild(n.firstChild); }

  function render() {
    clearNode(root);

    // Outer layout
    const container = el('div', { class: 'flex h-screen w-screen overflow-hidden bg-[#313338] text-[#dbdee1] font-sans' });

    // Left: ServerList (72px)
    container.appendChild(renderServerList());

    // Middle left: ChannelList (w-60)
    container.appendChild(renderChannelList());

    // Main area: Chat + Right user list
    const mainArea = el('div', { class: 'flex flex-1 flex-row min-w-0' });
    mainArea.appendChild(renderChatArea());
    mainArea.appendChild(renderUserList());
    container.appendChild(mainArea);

    root.appendChild(container);

    if (!state.user) {
      // show login overlay modal
      document.body.appendChild(renderLoginOverlay());
    }
  }

  // Server list
  function renderServerList() {
    const wrapper = el('div', { class: 'w-[72px] bg-[#1E1F22] flex flex-col items-center py-3 space-y-2 overflow-y-auto no-scrollbar' });

    // Home button
    const homeBtn = el('div', { class: 'group relative flex justify-center w-full cursor-pointer', onclick: () => { state.activeServerId = 'home'; render(); } });
    const leftIndicator = el('div', { class: `absolute left-0 bg-white rounded-r-lg transition-all duration-200 w-1 ${state.activeServerId === 'home' ? 'h-10 top-1.5' : 'h-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:h-5'}` });
    const homeInner = el('div', { class: `h-12 w-12 rounded-[24px] group-hover:rounded-[16px] flex items-center justify-center transition-all duration-200 ${state.activeServerId === 'home' ? 'bg-[#5865F2] text-white' : 'bg-[#313338] text-gray-400 group-hover:bg-[#5865F2] group-hover:text-white'}` },
      el('span', {}, '🏠')
    );
    homeBtn.appendChild(leftIndicator);
    homeBtn.appendChild(homeInner);
    wrapper.appendChild(homeBtn);

    // separator
    wrapper.appendChild(el('div', { class: 'w-8 h-[2px] bg-[#35363C] rounded-lg mx-auto my-1' }));

    // servers
    state.servers.forEach(server => {
      const sbtn = el('div', { class: 'group relative flex justify-center w-full cursor-pointer', onclick: () => { state.activeServerId = server.id; // load AI channels for non-real
          if (!server.isReal) { state.channels = [...INITIAL_CHANNELS]; state.categories = [...CATEGORIES]; if (!state.channels.find(c=>c.id===state.activeChannelId)) state.activeChannelId = state.channels[0].id; }
          render();
        }});
      const left = el('div', { class: `absolute left-0 bg-white rounded-r-lg transition-all duration-200 w-1 ${state.activeServerId === server.id ? 'h-10 top-1.5' : 'h-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:h-5'}` });
      const inner = el('div', { class: `h-12 w-12 rounded-[24px] group-hover:rounded-[16px] overflow-hidden transition-all duration-200 flex items-center justify-center bg-[#313338] text-[#dbdee1] text-xs font-medium hover:text-white ${state.activeServerId === server.id ? 'bg-[#5865F2]' : ''}` }, el('span', {}, server.icon ? '' : server.name.substring(0,2).toUpperCase()));
      sbtn.appendChild(left); sbtn.appendChild(inner); wrapper.appendChild(sbtn);
    });

    // Add button placeholders
    wrapper.appendChild(el('div', { class: 'group flex justify-center w-full cursor-pointer mt-2' },
      el('div', { class: 'h-12 w-12 rounded-[24px] bg-[#313338] group-hover:bg-[#23A559] group-hover:text-white text-[#23A559] flex items-center justify-center transition-all duration-200' }, '+')
    ));
    wrapper.appendChild(el('div', { class: 'group flex justify-center w-full cursor-pointer' },
      el('div', { class: 'h-12 w-12 rounded-[24px] bg-[#313338] group-hover:bg-[#23A559] group-hover:text-white text-[#23A559] flex items-center justify-center transition-all duration-200' }, '🔎')
    ));

    return wrapper;
  }

  // Channel list
  function renderChannelList() {
    const isHome = state.activeServerId === 'home';
    const currentServer = isHome ? null : state.servers.find(s => s.id === state.activeServerId);
    const wrapper = el('div', { class: 'w-60 bg-[#2B2D31] flex flex-col' });

    // Header
    wrapper.appendChild(el('div', { class: 'h-12 border-b border-[#1F2023] flex items-center px-4 font-bold text-white shadow-sm hover:bg-[#35373C] cursor-pointer transition-colors' },
      el('h1', { class: 'truncate' }, isHome ? 'Find or start a conversation' : (currentServer ? currentServer.name : 'Server'))
    ));

    // content
    const content = el('div', { class: 'flex-1 overflow-y-auto px-2 pt-3 space-y-4 custom-scrollbar' });

    if (isHome) {
      // DMs list
      content.appendChild(el('div', { class: 'flex items-center justify-between px-2 mb-2 text-xs font-bold text-[#949BA4] uppercase' }, el('span', {}, 'Direct Messages')));
      state.directMessages.forEach(channel => {
        const isActive = state.activeChannelId === channel.id;
        const recipient = channel.recipients && channel.recipients[0];
        const name = recipient ? recipient.username : channel.name;
        const avatar = recipient && recipient.avatar ? recipient.avatar : 'https://cdn.discordapp.com/embed/avatars/0.png';
        const item = el('div', { class: `group flex items-center px-2 py-1.5 rounded-[4px] cursor-pointer transition-colors ${isActive ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#dbdee1]'}`, onclick: ()=> { state.activeChannelId = channel.id; render(); } },
          el('div', { class: 'w-8 h-8 rounded-full bg-gray-600 mr-3 overflow-hidden' }, el('img', { src: avatar, class: 'w-full h-full object-cover' })),
          el('span', { class: 'truncate font-medium flex-1' }, name)
        );
        content.appendChild(item);
      });
    } else {
      // Server channels grouped by category + no category
      const noCat = state.channels.filter(c => !c.categoryId);
      if (noCat.length) {
        noCat.forEach(c => content.appendChild(renderChannelItem(c)));
      }
      state.categories.forEach(cat => {
        const group = state.channels.filter(ch => ch.categoryId === cat.id);
        if (!group.length) return;
        content.appendChild(el('div', { key: cat.id }, 
          el('div', { class: 'flex items-center justify-between px-2 mb-1 text-xs font-bold text-[#949BA4] uppercase hover:text-[#dbdee1] cursor-pointer' }, 
             el('span', { class: 'flex items-center' }, el('span', { class: 'mr-0.5' }, 'v'), cat.name)
          ),
          el('div', { class: 'space-y-0.5' }, ...group.map(ch => renderChannelItem(ch)))
        ));
      });
    }

    wrapper.appendChild(content);

    // Voice status panel
    if (state.voiceConnected) {
      wrapper.appendChild(el('div', { class: 'bg-[#232428] p-2 border-b border-[#1F2023]' },
        el('div', { class: 'flex items-center justify-between' },
          el('div', { class: 'flex flex-col' },
            el('span', { class: 'text-[#23a559] text-xs font-bold' }, 'Voice Connected'),
            el('span', { class: 'text-[#dbdee1] text-xs' }, `Gemini Voice / ${(currentServer && currentServer.name) || 'DM'}`)
          ),
          el('button', { class: 'p-2 hover:bg-[#35373C] rounded', onclick: ()=> { state.voiceConnected = false; render(); } }, '⛔')
        )
      ));
    }

    // User control panel
    const userPanel = el('div', { class: 'bg-[#232428] px-2 py-1.5 flex items-center justify-between mt-auto' },
      el('div', { class: 'flex items-center hover:bg-[#3F4147] p-1 rounded cursor-pointer -ml-1 mr-1' },
        el('div', { class: 'relative mr-2' },
          el('img', { src: (state.user && state.user.avatar) || 'https://cdn.discordapp.com/embed/avatars/0.png', class: 'w-8 h-8 rounded-full bg-gray-600' }),
          el('div', { class: 'absolute bottom-0 right-0 w-3 h-3 bg-[#23A559] border-2 border-[#232428] rounded-full' })
        ),
        el('div', { class: 'text-sm' },
          el('div', { class: 'font-semibold text-white leading-tight w-20 truncate' }, state.user ? state.user.username : 'Sign in'),
          el('div', { class: 'text-xs text-[#949BA4] leading-tight' }, state.user ? ('#' + (state.user.discriminator || '0000')) : '')
        )
      ),
      el('div', { class: 'flex items-center' },
        el('button', { class: 'p-1.5 hover:bg-[#3F4147] rounded cursor-pointer text-gray-200' }, '🎤'),
        el('button', { class: 'p-1.5 hover:bg-[#3F4147] rounded cursor-pointer text-gray-200' }, '🎧'),
        el('button', { class: 'p-1.5 hover:bg-[#3F4147] rounded cursor-pointer text-gray-200' }, '⚙️')
      )
    );

    wrapper.appendChild(userPanel);

    return wrapper;
  }

  function renderChannelItem(channel) {
    const isVoice = channel.type === 'voice';
    const isActive = state.activeChannelId === channel.id;
    const cls = `group flex items-center px-2 py-1.5 rounded-[4px] cursor-pointer transition-colors ${isActive ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#dbdee1]'}`;
    const icon = isVoice ? '🔊' : '#';
    const spanClass = `truncate font-medium ${isVoice && state.voiceConnected && isActive ? 'text-[#23a559]' : ''}`;
    return el('div', { class: cls, onclick: ()=> { if (isVoice) { state.voiceConnected = !state.voiceConnected; state.activeChannelId = channel.id; } else { state.activeChannelId = channel.id; } render(); } },
      el('span', { class: 'mr-1.5 text-[#949BA4]' }, icon),
      el('span', { class: spanClass }, channel.name)
    );
  }

  // Chat area
  function renderChatArea() {
    const channelList = (state.activeServerId === 'home') ? state.directMessages : state.channels;
    let activeChannel = channelList.find(c => c.id === state.activeChannelId) || channelList[0] || { id: 'none', name: 'General' };

    const wrapper = el('div', { class: 'flex-1 flex flex-col bg-[#313338] min-w-0' });

    // Header
    wrapper.appendChild(el('div', { class: 'h-12 px-4 flex items-center border-b border-[#26272D] shadow-sm shrink-0' },
      el('span', { class: 'text-[#80848E] mr-2' }, '#'),
      el('h3', { class: 'font-bold text-white mr-4' }, activeChannel.name),
      el('span', { class: 'text-[#949BA4] text-sm hidden sm:block truncate border-l border-[#3F4147] pl-4' }, `This is the start of the #${activeChannel.name} channel.`)
    ));

    // Messages area
    const msgArea = el('div', { class: 'flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-2 space-y-[1.0625rem]' });

    // welcome placeholder
    msgArea.appendChild(el('div', { class: 'mt-10 mb-8' },
      el('div', { class: 'h-16 w-16 bg-[#41434A] rounded-full flex items-center justify-center mb-4' }, el('span', { class: 'text-white text-3xl' }, '#')),
      el('h1', { class: 'text-3xl font-bold text-white mb-2' }, `Welcome to #${activeChannel.name}!`),
      el('p', { class: 'text-[#B5BAC1]' }, `This is the start of the #${activeChannel.name} channel.`)
    ));

    const channelMessages = state.messages[state.activeChannelId] || [];
    channelMessages.forEach((msg, i) => {
      const prev = channelMessages[i-1];
      const isGrouped = prev && prev.author && msg.author && prev.author.id === msg.author.id;
      const item = el('div', { class: `group flex ${isGrouped ? 'mt-[2px]' : 'mt-[17px]'} hover:bg-[#2e3035] -mx-4 px-4 py-0.5` },
        !isGrouped ? el('div', { class: 'w-10 h-10 rounded-full bg-gray-600 mr-4 shrink-0 overflow-hidden mt-0.5 cursor-pointer active:translate-y-[1px]' }, el('img', { src: msg.author.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png', class: 'w-full h-full object-cover' })) :
          el('div', { class: 'w-10 mr-4 shrink-0 text-[10px] text-[#949BA4] opacity-0 group-hover:opacity-100 flex items-center justify-center' }, new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) ),
        el('div', { class: 'flex-1 min-w-0' },
          !isGrouped ? el('div', { class: 'flex items-center mb-1' },
            el('span', { class: `font-medium mr-2 hover:underline cursor-pointer ${msg.author.isBot ? 'text-white' : 'text-white'}` }, msg.author.username),
            msg.author.isBot ? el('span', { class: 'bg-[#5865F2] text-white text-[10px] px-1.5 rounded-[3px] py-[0.5px] mr-2 flex items-center' }, 'APP') : null,
            el('span', { class: 'text-xs text-[#949BA4] ml-1' }, formatTime(msg.timestamp))
          ) : null,
          el('div', { class: 'text-[#DBDEE1] whitespace-pre-wrap leading-[1.375rem]' }, msg.content)
        )
      );
      msgArea.appendChild(item);
    });

    // loading indicator
    if (state.isLoading) {
      msgArea.appendChild(el('div', { class: 'flex items-center mt-2 pl-[3.5rem]' },
        el('div', { class: 'flex space-x-1' },
          el('div', { class: 'w-2 h-2 bg-[#dbdee1] rounded-full animate-bounce' }),
          el('div', { class: 'w-2 h-2 bg-[#dbdee1] rounded-full animate-bounce' }),
          el('div', { class: 'w-2 h-2 bg-[#dbdee1] rounded-full animate-bounce' })
        )
      ));
    }

    const endRef = el('div');
    msgArea.appendChild(endRef);

    wrapper.appendChild(msgArea);

    // Input area
    const inputWrapper = el('div', { class: 'px-4 pb-6 shrink-0' },
      el('div', { class: 'bg-[#383A40] rounded-lg px-4 py-2.5 flex items-center' },
        el('button', { class: 'text-[#B5BAC1] hover:text-[#dbdee1] mr-3 cursor-pointer p-1' }, '+'),
        el('input', { id: 'message-input', type: 'text', class: 'flex-1 bg-transparent text-[#dbdee1] outline-none placeholder-[#949BA4]', placeholder: `Message #${activeChannel.name}` }),
        el('div', { class: 'flex items-center space-x-3 ml-2' },
          el('div', { class: 'text-[#B5BAC1]' }, '🎁'),
          el('div', { class: 'text-[#B5BAC1]' }, '🧩'),
          el('div', { class: 'text-[#B5BAC1]' }, '😊'),
          el('button', { id: 'send-button', class: 'ml-2 text-[#B5BAC1] hover:text-white cursor-pointer' }, 'Send')
        )
      )
    );

    wrapper.appendChild(inputWrapper);

    // attach send events (small delay to ensure DOM placed)
    setTimeout(() => {
      const input = document.getElementById('message-input');
      const sendBtn = document.getElementById('send-button');
      if (input) {
        input.value = '';
        input.onkeydown = e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageFromInput();
          }
        };
      }
      if (sendBtn) sendBtn.onclick = sendMessageFromInput;
      // scroll to bottom
      endRef.scrollIntoView({ behavior: 'smooth' });
    }, 0);

    return wrapper;
  }

  function renderUserList() {
    // Simple right-hand user list (hidden on small screens)
    const ONLINE_USERS = [
      { id: '1', name: 'Gemini', avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg', isBot: true, status: 'online' },
      { id: '2', name: 'React Expert', avatar: 'https://picsum.photos/id/10/200/200', isBot: true, status: 'online' },
      { id: '3', name: 'Moderator', avatar: 'https://picsum.photos/id/64/200/200', isBot: false, status: 'idle' },
    ];

    const OFFLINE_USERS = [
      { id: '4', name: 'Gamer123', avatar: 'https://picsum.photos/id/70/200/200', isBot: false, status: 'offline' },
      { id: '5', name: 'DevOps', avatar: 'https://picsum.photos/id/90/200/200', isBot: false, status: 'offline' },
    ];

    const wrapper = el('div', { class: 'w-60 bg-[#2B2D31] hidden lg:flex flex-col overflow-y-auto p-4 custom-scrollbar shrink-0' },
      el('div', { class: 'mb-6' },
        el('h3', { class: 'text-[#949BA4] text-xs font-bold uppercase mb-2 px-2' }, `Online — ${ONLINE_USERS.length}`),
        el('div', { class: 'space-y-0.5' }, ...ONLINE_USERS.map(user => el('div', { class: 'flex items-center px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer opacity-100 group' },
          el('div', { class: 'relative mr-3' },
            el('div', { class: 'w-8 h-8 rounded-full bg-gray-600 overflow-hidden' }, el('img', { src: user.avatar, class: 'w-full h-full object-cover' })),
            el('div', { class: `absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-[#2B2D31] rounded-full ${user.status === 'online' ? 'bg-[#23A559]' : 'bg-[#F0B232]'}` })
          ),
          el('div', { class: 'flex flex-col' },
            el('div', { class: 'flex items-center' },
              el('span', { class: 'font-medium text-white group-hover:text-[#dbdee1]' }, user.name),
              user.isBot ? el('span', { class: 'ml-1.5 bg-[#5865F2] text-white text-[10px] px-1.5 rounded py-[1px]' }, 'BOT') : null
            ),
            user.isBot ? el('div', { class: 'text-xs text-[#949BA4]' }, 'Thinking...') : null
          )
        )))
      ),
      el('div', {},
        el('h3', { class: 'text-[#949BA4] text-xs font-bold uppercase mb-2 px-2' }, `Offline — ${OFFLINE_USERS.length}`),
        el('div', { class: 'space-y-0.5' }, ...OFFLINE_USERS.map(user => el('div', { class: 'flex items-center px-2 py-1.5 rounded hover:bg-[#35373C] cursor-pointer opacity-50 hover:opacity-100 group' },
          el('div', { class: 'relative mr-3' },
            el('div', { class: 'w-8 h-8 rounded-full bg-gray-600 overflow-hidden grayscale' }, el('img', { src: user.avatar, class: 'w-full h-full object-cover' })),
            el('div', { class: 'absolute bottom-0 right-0 w-3.5 h-3.5 border-[3px] border-[#2B2D31] rounded-full bg-[#80848E]' })
          ),
          el('div', { class: 'font-medium text-[#949BA4] group-hover:text-[#dbdee1]' }, user.name)
        )))
      )
    );
    return wrapper;
  }

  // -------------------------
  // Login overlay
  // -------------------------
  function renderLoginOverlay() {
    const overlay = el('div', { class: 'fixed inset-0 z-50 flex items-center justify-center' });
    const background = el('div', { class: 'absolute inset-0 bg-[url("https://cdn.discordapp.com/attachments/1083431668858728562/1155093751714856990/discord_login_bg.png")] bg-cover opacity-100' });
    const modal = el('div', { class: 'bg-[#313338] p-8 rounded-[5px] shadow-2xl w-full max-w-[784px] z-10 flex flex-row animate-fade-in-up items-center' });

    // Left form
    const left = el('div', { class: 'flex-1 pr-8' },
      el('div', { class: 'text-center mb-8' },
        el('h2', { class: 'text-2xl font-bold text-white mb-2' }, 'Welcome back!'),
        el('p', { class: 'text-[#B5BAC1]' }, "We're so excited to see you again!")
      )
    );

    // Mode switcher
    let mode = 'ai'; // 'ai' or 'discord'
    const modeSwitcher = el('div', { class: 'bg-[#2B2D31] p-1 rounded mb-6 flex' },
      el('button', { class: `flex-1 py-1 text-sm font-bold rounded transition-colors ${mode === 'ai' ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#dbdee1]'}`, onclick: ()=> { mode='ai'; updateMode(); } }, 'Simulated (AI)'),
      el('button', { class: `flex-1 py-1 text-sm font-bold rounded transition-colors ${mode === 'discord' ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#dbdee1]'}`, onclick: ()=> { mode='discord'; updateMode(); } }, 'Real Discord')
    );

    // Form fields
    const form = el('form', { onsubmit: (e)=> { e.preventDefault(); doLogin(); } });

    const aiField = el('div', { class: 'mb-4', id: 'ai-field' },
      el('label', { class: 'block text-[#B5BAC1] text-xs font-bold uppercase mb-2' }, 'Display Name ', el('span', { class: 'text-red-500' }, '*')),
      el('input', { id: 'ai-username', type: 'text', class: 'w-full bg-[#1E1F22] text-white p-2.5 rounded-[3px] outline-none border-none focus:ring-0 font-light', required: true })
    );

    const discordField = el('div', { id: 'discord-fields', style: 'display:none' },
      el('div', { class: 'mb-4' },
        el('label', { class: 'block text-[#B5BAC1] text-xs font-bold uppercase mb-2' }, 'User Token ', el('span', { class: 'text-red-500' }, '*')),
        el('input', { id: 'discord-token', type: 'password', class: 'w-full bg-[#1E1F22] text-white p-2.5 rounded-[3px] outline-none border-none focus:ring-0 font-light', placeholder: 'Discord User Token' }),
        el('div', { class: 'text-[#00A8FC] text-xs mt-1' }, 'Warning: Never share your token. Use at your own risk.')
      ),
      el('div', { class: 'mb-4' },
        el('label', { class: 'block text-[#B5BAC1] text-xs font-bold uppercase mb-2' }, 'CORS Proxy URL (Optional)'),
        el('input', { id: 'discord-proxy', type: 'text', class: 'w-full bg-[#1E1F22] text-white p-2.5 rounded-[3px] outline-none border-none focus:ring-0 font-light', placeholder: 'https://corsproxy.io/?' }),
        el('div', { class: 'text-[#949BA4] text-[10px] mt-1' }, "Required for browser-based access. Try 'https://corsproxy.io/?' if blocked.")
      )
    );

    const submitBtn = el('button', { type: 'submit', id: 'login-submit', class: 'w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2.5 rounded-[3px] transition-colors mb-4' }, 'Start AI Chat');

    form.appendChild(aiField);
    form.appendChild(discordField);
    form.appendChild(submitBtn);

    left.appendChild(modeSwitcher);
    left.appendChild(form);
    modal.appendChild(left);

    // Right side: QR visual only
    const right = el('div', { class: 'hidden md:flex flex-col items-center justify-center pl-8 border-l border-[#3F4147] w-[240px]' },
      el('div', { class: 'w-[176px] h-[176px] bg-white rounded-lg p-2 mb-6 flex items-center justify-center' },
        el('img', { src: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://discord.com', alt: 'QR Code' })
      ),
      el('h3', { class: 'text-xl font-bold text-white mb-2' }, 'Log in with QR Code'),
      el('p', { class: 'text-[#B5BAC1] text-center text-sm' }, el('strong', {}, 'Scan this with the Discord mobile app'), ' to log in instantly.')
    );

    modal.appendChild(right);
    overlay.appendChild(background);
    overlay.appendChild(modal);

    // Behavior
    function updateMode() {
      // Update labels/classes visually
      const children = modeSwitcher.children;
      children[0].className = `flex-1 py-1 text-sm font-bold rounded transition-colors ${mode === 'ai' ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#dbdee1]'}`;
      children[1].className = `flex-1 py-1 text-sm font-bold rounded transition-colors ${mode === 'discord' ? 'bg-[#5865F2] text-white' : 'text-[#949BA4] hover:text-[#dbdee1]'}`;
      document.getElementById('ai-field').style.display = mode === 'ai' ? '' : 'none';
      document.getElementById('discord-fields').style.display = mode === 'discord' ? '' : 'none';
      submitBtn.textContent = mode === 'ai' ? 'Start AI Chat' : 'Login to Discord';
    }

    async function doLogin() {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connecting...';
      try {
        if (mode === 'ai') {
          const username = document.getElementById('ai-username').value.trim();
          if (!username) return alert('Enter a display name');
          const newUser = {
            id: 'user-' + Date.now(),
            username,
            discriminator: (1000 + Math.floor(Math.random()*9000)).toString(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
            status: 'online'
          };
          state.user = newUser;
          localStorage.setItem('discord_ai_user', JSON.stringify(newUser));
          document.body.removeChild(overlay);
          render();
        } else {
          const tokenInput = document.getElementById('discord-token').value.trim();
          const proxyInput = document.getElementById('discord-proxy').value.trim();
          if (!tokenInput) return alert('Enter token or use AI mode.');
          // Try fetching user/guilds — may be blocked by CORS
          try {
            const result = await tryFetchUserAndGuilds(tokenInput, proxyInput);
            // map to our shapes
            const discordUser = {
              id: result.user.id,
              username: result.user.username,
              discriminator: result.user.discriminator,
              avatar: result.user.avatar ? `https://cdn.discordapp.com/avatars/${result.user.id}/${result.user.avatar}.png` : undefined
            };
            const guilds = (result.guilds || []).map(g => ({ id: g.id, name: g.name, icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null, isReal: true }));
            state.user = discordUser;
            state.discordToken = tokenInput;
            state.proxyUrl = proxyInput || '';
            state.servers = [{ id:'home', name:'Home', isReal:false }, ...guilds];
            localStorage.setItem('discord_ai_user', JSON.stringify(discordUser));
            localStorage.setItem('discord_token', tokenInput);
            if (proxyInput) localStorage.setItem('discord_proxy', proxyInput);
            document.body.removeChild(overlay);
            // load DMs
            try {
              const dms = await discordFetch('/users/@me/channels', state.discordToken, state.proxyUrl);
              if (Array.isArray(dms)) {
                state.directMessages = dms.map(d => {
                  const r = d.recipients && d.recipients[0];
                  return { id: d.id, name: r ? r.username : d.id, type: 'dm', recipients: r ? [{ id: r.id, username: r.username, avatar: r.avatar ? `https://cdn.discordapp.com/avatars/${r.id}/${r.avatar}.png` : undefined }] : [] };
                });
                if (state.directMessages.length) state.activeChannelId = state.directMessages[0].id;
              }
            } catch (e) {
              // ignore DM load errors (likely CORS)
              console.warn('Failed to load DMs', e);
            }
            render();
          } catch (e) {
            alert('Failed to login to Discord. Check token/proxy and CORS. Error: ' + e.message);
          }
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'ai' ? 'Start AI Chat' : 'Login to Discord';
      }
    }

    return overlay;
  }

  // -------------------------
  // Sending messages
  // -------------------------
  async function sendMessageFromInput() {
    const input = document.getElementById('message-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    if (!state.user) return alert('You must login first.');

    const activeServer = state.servers.find(s => s.id === state.activeServerId);
    const isRealServer = activeServer && activeServer.isReal;
    const isHome = state.activeServerId === 'home';

    // If real server or home with token, try to send via Discord API
    if ((isRealServer || (isHome && state.discordToken)) && state.discordToken) {
      try {
        // optimistic update
        const newMsg = {
          id: 'temp-' + Date.now(),
          content: text,
          author: state.user,
          timestamp: new Date().toISOString(),
          channelId: state.activeChannelId
        };
        state.messages[state.activeChannelId] = [...(state.messages[state.activeChannelId]||[]), newMsg];
        render();
        // call Discord
        await discordFetch(`/channels/${state.activeChannelId}/messages`, state.discordToken, state.proxyUrl, { method: 'POST', body: JSON.stringify({ content: text }) });
        // after send we could refresh messages; for simplicity we leave optimistic message
      } catch (e) {
        alert('Failed to send real message: ' + e.message);
      }
      return;
    }

    // AI simulated response flow
    const newMessage = {
      id: Date.now().toString(),
      content: text,
      author: state.user,
      timestamp: new Date().toISOString(),
      channelId: state.activeChannelId
    };
    state.messages[state.activeChannelId] = [...(state.messages[state.activeChannelId]||[]), newMessage];
    render();

    state.isLoading = true;
    render(); // show loading
    try {
      const activeChannel = (state.activeServerId === 'home') ? state.directMessages.find(c => c.id === state.activeChannelId) : state.channels.find(c => c.id === state.activeChannelId);
      const history = state.messages[state.activeChannelId] || [];
      const contextName = (activeChannel && activeChannel.name) || 'general';
      const aiText = await generateAIResponse(text, contextName, history);
      const botUser = { id: 'gemini-bot', username: 'Gemini', discriminator: '0000', avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg', status: 'online', isBot: true };
      const aiMessage = { id: (Date.now()+1).toString(), content: aiText, author: botUser, timestamp: new Date().toISOString(), channelId: state.activeChannelId };
      state.messages[state.activeChannelId] = [...(state.messages[state.activeChannelId]||[]), aiMessage];
    } catch (e) {
      console.warn('AI response failed', e);
    } finally {
      state.isLoading = false;
      render();
    }
  }

  // -------------------------
  // Bootstrap
  // -------------------------
  render();

})();
