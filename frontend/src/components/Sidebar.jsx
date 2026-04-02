import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, MoreVertical, Search, Moon, Sun, Filter, Settings, Trash2, LogOut, User as UserIcon, X, ArrowLeft, Camera, Check, Edit2, Lock, Shield, Bell, BellOff, Smartphone, Volume2, Monitor, Palette, HelpCircle, ChevronRight } from 'lucide-react';
import axios from 'axios';
import useUnreadCount from '../hooks/useUnreadCount';
import UnreadBadge from './UnreadBadge';

const Sidebar = ({ contacts, lastMessages, selectedContact, setSelectedContact, clearChat, mutedContacts = [] }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { onlineUsers, typingUsers, recordingUsers } = useSocket();
  const { unreadCounts, markAsRead } = useUnreadCount();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentFilter, setCurrentFilter] = React.useState('all'); // 'all', 'unread', 'groups'
  const [currentView, setCurrentView] = React.useState('chats'); // 'chats', 'profile', 'settings'
  const [settingSubView, setSettingSubView] = React.useState('main'); // 'main', 'privacy', 'chats', 'desktop'
  const [activePrivacySetting, setActivePrivacySetting] = React.useState(null);
  const [privacyOptions, setPrivacyOptions] = React.useState({
    'Last Seen': 'Everyone',
    'Profile Photo': 'Everyone',
    'About': 'Everyone',
    'readReceipts': true
  });
  const [desktopOptions, setDesktopOptions] = React.useState({
    notifications: true,
    sounds: true,
    security: false
  });
  const menuRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const { updateUser } = useAuth();
  
  // Editing States
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [isEditingAbout, setIsEditingAbout] = React.useState(false);
  const [tempName, setTempName] = React.useState(user?.username || '');
  const [tempAbout, setTempAbout] = React.useState(user?.status || 'Available');
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const token = localStorage.getItem('chat-token');
        const res = await axios.put('http://localhost:5000/api/auth/profile', 
          { avatar: reader.result },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updateUser(res.data);
      } catch (err) {
        console.error('Error updating avatar:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('chat-token');
      const res = await axios.put('http://localhost:5000/api/auth/profile', 
        { username: tempName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(res.data);
      setIsEditingName(false);
    } catch (err) {
      console.error('Error updating name:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAbout = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('chat-token');
      const res = await axios.put('http://localhost:5000/api/auth/profile', 
        { status: tempAbout },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(res.data);
      setIsEditingAbout(false);
    } catch (err) {
      console.error('Error updating about:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderProfileView = () => (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-wa-header-dark animate-slide-in">
       <div className="p-4 flex items-center gap-6 bg-wa-teal text-white shrink-0 h-[108px] items-end pb-5">
          <ArrowLeft className="cursor-pointer" onClick={() => setCurrentView('chats')} />
          <h2 className="text-[19px] font-semibold">Profile</h2>
       </div>
       <div className="flex-1 overflow-y-auto pt-7 pb-6 space-y-8 flex flex-col items-center custom-scrollbar">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
             <img src={user.avatar} alt="Avatar" className="w-[200px] h-[200px] rounded-full object-cover border-4 border-white dark:border-wa-border-dark shadow-sm transition-transform duration-500 group-hover:scale-[1.02]" />
             <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all rounded-full p-4 text-center">
                <Camera size={32} />
                <span className="text-[12px] mt-1 font-semibold uppercase leading-tight">Change Profile Photo</span>
             </div>
             <input type="file" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" />
          </div>

          <div className="w-full space-y-6">
             <div className="bg-white dark:bg-wa-sidebar-dark px-7 py-4 shadow-sm border-b dark:border-wa-border-dark transition-all">
                <label className="text-[14px] text-wa-teal font-medium block mb-4">Your name</label>
                {!isEditingName ? (
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => { setIsEditingName(true); setTempName(user.username); }}>
                     <p className="text-[17px] dark:text-wa-text-primary-dark font-medium">{user.username}</p>
                     <Edit2 size={18} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-b-2 border-wa-teal pb-1">
                     <input 
                      autoFocus
                      type="text" 
                      className="bg-transparent border-none focus:outline-none text-[17px] w-full dark:text-wa-text-primary-dark"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                     />
                     <Check size={22} className="text-wa-teal cursor-pointer hover:scale-110 transition-transform" onClick={handleSaveName} />
                  </div>
                )}
             </div>

             <div className="bg-white dark:bg-wa-sidebar-dark px-7 py-4 shadow-sm border-b dark:border-wa-border-dark transition-all">
                <label className="text-[14px] text-wa-teal font-medium block mb-4">About</label>
                {!isEditingAbout ? (
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => { setIsEditingAbout(true); setTempAbout(user.status || 'Available'); }}>
                     <p className="text-[17px] dark:text-wa-text-primary-dark opacity-80 leading-relaxed">{user.status || 'Available'}</p>
                     <Edit2 size={18} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-b-2 border-wa-teal pb-1">
                     <input 
                      autoFocus
                      type="text" 
                      className="bg-transparent border-none focus:outline-none text-[17px] w-full dark:text-wa-text-primary-dark"
                      value={tempAbout}
                      onChange={(e) => setTempAbout(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveAbout()}
                     />
                     <Check size={22} className="text-wa-teal cursor-pointer hover:scale-110 transition-transform" onClick={handleSaveAbout} />
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );

  const renderSettingsView = () => {
    const renderMainSettings = () => (
      <div className="flex flex-col h-full bg-wa-header-bg dark:bg-wa-header-dark animate-slide-in">
         <div className="p-4 flex items-center gap-6 bg-wa-teal text-white shrink-0 h-[108px] items-end pb-5 transition-all">
            <ArrowLeft className="cursor-pointer" onClick={() => setCurrentView('chats')} />
            <h2 className="text-[19px] font-semibold">Settings</h2>
         </div>
         <div className="flex-1 overflow-y-auto pt-4 flex flex-col custom-scrollbar">
            {/* User Profile Summary */}
            <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-all mb-2" onClick={() => setCurrentView('profile')}>
               <img src={user.avatar} alt="Avatar" className="w-[82px] h-[82px] rounded-full object-cover border border-gray-100 dark:border-wa-border-dark" />
               <div className="flex flex-col">
                  <span className="text-[18px] font-medium dark:text-wa-text-primary-dark">{user.username}</span>
                  <span className="text-[14px] text-gray-500 truncate max-w-[240px] mt-0.5">{user.status || 'Available'}</span>
               </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-wa-border-dark/30 transition-all" onClick={() => setSettingSubView('privacy')}>
               <Lock size={22} className="text-gray-400 group-hover:text-wa-teal" />
               <div className="flex-1">
                  <span className="text-[16px] dark:text-wa-text-primary-dark block">Privacy</span>
                  <span className="text-[13px] text-gray-400">Block contacts, disappearing messages</span>
               </div>
               <ChevronRight size={18} className="text-gray-300" />
            </div>

            <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-wa-border-dark/30 transition-all" onClick={() => setSettingSubView('chats')}>
               <MessageSquare size={22} className="text-gray-400 group-hover:text-wa-teal" />
               <div className="flex-1">
                  <span className="text-[16px] dark:text-wa-text-primary-dark block">Chats</span>
                  <span className="text-[13px] text-gray-400">Theme, wallpapers, chat history</span>
               </div>
               <ChevronRight size={18} className="text-gray-300" />
            </div>

            <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-wa-border-dark/30 transition-all" onClick={() => setSettingSubView('desktop')}>
               <Monitor size={22} className="text-gray-400 group-hover:text-wa-teal" />
               <div className="flex-1">
                  <span className="text-[16px] dark:text-wa-text-primary-dark block">Desktop Settings</span>
                  <span className="text-[13px] text-gray-400">Notifications, sounds</span>
               </div>
               <ChevronRight size={18} className="text-gray-300" />
            </div>

            <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer border-b border-gray-50 dark:border-wa-border-dark/30 transition-all">
               <HelpCircle size={22} className="text-gray-400 group-hover:text-wa-teal" />
               <div className="flex-1">
                  <span className="text-[16px] dark:text-wa-text-primary-dark block">Help</span>
                  <span className="text-[13px] text-gray-400">Help center, contact us</span>
               </div>
               <ChevronRight size={18} className="text-gray-300" />
            </div>
         </div>
      </div>
    );

    const renderPrivacySettings = () => {
      if (activePrivacySetting) {
         return (
           <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-wa-header-dark animate-slide-in">
              <div className="p-4 flex items-center gap-6 bg-wa-teal text-white shrink-0 h-[108px] items-end pb-5 transition-all">
                 <ArrowLeft className="cursor-pointer" onClick={() => setActivePrivacySetting(null)} />
                 <h2 className="text-[19px] font-semibold">{activePrivacySetting}</h2>
              </div>
              <div className="flex-1 overflow-y-auto pt-4 flex flex-col custom-scrollbar bg-white dark:bg-wa-sidebar-dark shadow-sm">
                 <div className="py-2">
                    <span className="text-sm text-wa-teal font-semibold px-6 mb-2 block">Who can see my {activePrivacySetting.toLowerCase()}</span>
                    <div className="space-y-0">
                       {['Everyone', 'My contacts', 'My contacts except...', 'Nobody'].map((option) => (
                         <div 
                           key={option} 
                           className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 px-6 py-4 transition-all group"
                           onClick={() => setPrivacyOptions(prev => ({ ...prev, [activePrivacySetting]: option }))}
                         >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${privacyOptions[activePrivacySetting] === option ? 'border-wa-teal' : 'border-gray-400 group-hover:border-wa-teal'}`}>
                               {privacyOptions[activePrivacySetting] === option && <div className="w-2.5 h-2.5 bg-wa-teal rounded-full"></div>}
                            </div>
                            <span className="text-[16px] dark:text-wa-text-primary-dark">{option}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
         );
      }

      return (
      <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-wa-header-dark animate-slide-in">
         <div className="p-4 flex items-center gap-6 bg-wa-teal text-white shrink-0 h-[108px] items-end pb-5 transition-all">
            <ArrowLeft className="cursor-pointer" onClick={() => setSettingSubView('main')} />
            <h2 className="text-[19px] font-semibold">Privacy</h2>
         </div>
         <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
            <div className="bg-white dark:bg-wa-sidebar-dark px-6 py-5 shadow-sm mb-2">
               <span className="text-xs text-wa-teal font-semibold uppercase tracking-wider mb-6 block">Who can see my personal info</span>
               
               <div className="space-y-0">
                  {['Last Seen', 'Profile Photo', 'About'].map((item) => (
                    <div key={item} className="flex flex-col cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/5 -mx-6 px-6 py-3 transition-all" onClick={() => setActivePrivacySetting(item)}>
                       <span className="text-[16px] dark:text-wa-text-primary-dark">{item}</span>
                       <span className="text-[14px] text-gray-500 mt-0.5">{privacyOptions[item]}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white dark:bg-wa-sidebar-dark px-6 py-5 shadow-sm mb-2">
               <div className="flex flex-col gap-1">
                  <span className="text-[16px] dark:text-wa-text-primary-dark mb-1">Read receipts</span>
                  <div className="flex items-center justify-between">
                     <span className="text-[13px] text-gray-500 max-w-[280px] leading-relaxed">If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.</span>
                     <div 
                       className={`w-[42px] h-6 rounded-full relative shadow-inner cursor-pointer transition-colors ${privacyOptions.readReceipts ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}
                       onClick={() => setPrivacyOptions(prev => ({ ...prev, readReceipts: !prev.readReceipts }))}
                     >
                        <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all ${privacyOptions.readReceipts ? 'right-[2px]' : 'left-[2px]'}`}></div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-wa-sidebar-dark px-6 py-4 flex items-center justify-between shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
               <span className="text-[16px] dark:text-wa-text-primary-dark">Blocked contacts</span>
               <span className="text-[14px] text-gray-400 flex items-center gap-1">0 <ChevronRight size={16} /></span>
            </div>
         </div>
      </div>
    );
    };

    const renderChatSettings = () => (
      <div className="flex flex-col h-full bg-wa-header-bg dark:bg-wa-header-dark animate-slide-in">
         <div className="p-4 flex items-center gap-6 bg-wa-teal text-white shrink-0 h-[108px] items-end pb-5 transition-all">
            <ArrowLeft className="cursor-pointer" onClick={() => setSettingSubView('main')} />
            <h2 className="text-[19px] font-semibold">Chats</h2>
         </div>
         <div className="flex-1 overflow-y-auto py-5 flex flex-col custom-scrollbar">
            {/* Theme Section */}
            <div className="px-6 py-4 border-b dark:border-wa-border-dark/30 transition-all">
               <label className="text-[14px] text-wa-teal font-medium block mb-4 flex items-center gap-2">Display <Palette size={16} /></label>
               <div className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/5 p-3 -mx-3 rounded-lg cursor-pointer transition-all" onClick={toggleTheme}>
                  <div className="flex flex-col">
                     <span className="text-[16px] dark:text-wa-text-primary-dark">Theme</span>
                     <span className="text-[13px] text-gray-400 capitalize">{theme}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
               </div>
            </div>

            {/* Wallpaper Palette */}
            <div className="px-6 py-6">
               <label className="text-[14px] text-wa-teal font-medium block mb-4">Chat Wallpaper</label>
               <div className="grid grid-cols-5 gap-3 shrink-0">
                  {['#efeae2', '#f3f3f3', '#d9dbd5', '#72b693', '#ffbcaf', '#b3bfc4', '#c9e265', '#e9d6d1', '#7be5df', '#f0f0f0'].map((color) => (
                    <div 
                      key={color} 
                      className={`h-12 w-12 rounded-lg cursor-pointer hover:scale-110 transition-all border border-gray-200 dark:border-white/10 shadow-sm ${localStorage.getItem('chat-wallpaper') === color ? 'ring-2 ring-wa-teal ring-offset-2 dark:ring-offset-wa-header-dark' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        localStorage.setItem('chat-wallpaper', color);
                        document.documentElement.style.setProperty('--chat-wallpaper', color);
                        setSettingSubView('chats'); // Re-render logic
                      }}
                    />
                  ))}
               </div>
               <p className="text-[12px] text-gray-500 mt-4 leading-normal">Choose a custom color to personalize your chat backgrounds.</p>
            </div>
         </div>
      </div>
    );

    const renderDesktopSettings = () => (
      <div className="flex flex-col h-full bg-wa-header-bg dark:bg-wa-header-dark animate-slide-in">
         <div className="p-4 flex items-center gap-6 bg-wa-teal text-white shrink-0 h-[108px] items-end pb-5 transition-all">
            <ArrowLeft className="cursor-pointer" onClick={() => setSettingSubView('main')} />
            <h2 className="text-[19px] font-semibold">Desktop Settings</h2>
         </div>
         <div className="flex-1 overflow-y-auto py-4 flex flex-col custom-scrollbar">
            <div className="px-6 py-4">
               <div 
                 className="flex items-center justify-between mb-8 group cursor-pointer"
                 onClick={() => setDesktopOptions(prev => ({ ...prev, notifications: !prev.notifications }))}
               >
                  <div className="flex items-center gap-4">
                     <Bell size={22} className="text-gray-400 group-hover:text-wa-teal transition-colors" />
                     <span className="text-[16px] dark:text-wa-text-primary-dark">Desktop Notifications</span>
                  </div>
                  <div className={`w-[42px] h-6 rounded-full relative shadow-inner transition-colors ${desktopOptions.notifications ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}>
                     <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all ${desktopOptions.notifications ? 'right-[2px]' : 'left-[2px]'}`}></div>
                  </div>
               </div>

               <div 
                 className="flex items-center justify-between mb-8 group cursor-pointer"
                 onClick={() => setDesktopOptions(prev => ({ ...prev, sounds: !prev.sounds }))}
               >
                  <div className="flex items-center gap-4">
                     <Volume2 size={22} className="text-gray-400 group-hover:text-wa-teal transition-colors" />
                     <span className="text-[16px] dark:text-wa-text-primary-dark">Incoming Message Sounds</span>
                  </div>
                  <div className={`w-[42px] h-6 rounded-full relative shadow-inner transition-colors ${desktopOptions.sounds ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}>
                     <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all ${desktopOptions.sounds ? 'right-[2px]' : 'left-[2px]'}`}></div>
                  </div>
               </div>

               <div 
                 className="flex items-center justify-between group cursor-pointer"
                 onClick={() => setDesktopOptions(prev => ({ ...prev, security: !prev.security }))}
               >
                  <div className="flex items-center gap-4">
                     <Smartphone size={22} className="text-gray-400 group-hover:text-wa-teal transition-colors" />
                     <span className="text-[16px] dark:text-wa-text-primary-dark">Security Notifications</span>
                  </div>
                  <div className={`w-[42px] h-6 rounded-full relative shadow-inner transition-colors ${desktopOptions.security ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}>
                     <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all ${desktopOptions.security ? 'right-[2px]' : 'left-[2px]'}`}></div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );

    if (settingSubView === 'privacy') return renderPrivacySettings();
    if (settingSubView === 'chats') return renderChatSettings();
    if (settingSubView === 'desktop') return renderDesktopSettings();
    return renderMainSettings();
  };

  if (currentView === 'profile') return renderProfileView();
  if (currentView === 'settings') return renderSettingsView();

  return (
    <div className="w-[420px] border-r border-gray-200 dark:border-wa-border-dark flex flex-col bg-white dark:bg-wa-sidebar-dark h-full shrink-0 transition-colors duration-500">
      
      {/* Header - Compact Profile */}
      <div className="h-[60px] bg-wa-header-bg dark:bg-wa-header-dark flex items-center justify-between px-4 shrink-0 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setCurrentView('profile')}>
            <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200 dark:border-wa-border-dark group-hover:opacity-90 transition-all shadow-sm" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] dark:text-wa-text-primary-dark">{user.username}</span>
            <span className="text-[11px] text-wa-teal font-medium uppercase tracking-wider">Online</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-gray-500 dark:text-wa-text-secondary-dark">
          <button onClick={toggleTheme} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-all" title="Toggle theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
          </button>
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-all">
            <MessageSquare size={20} />
          </button>
          <div className="relative" ref={menuRef}>
            <button className={`p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-all ${isMenuOpen ? 'bg-gray-200 dark:bg-white/10' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu">
              <MoreVertical size={20} />
            </button>

            {/* Professional Sidebar Dropdown */}
            {isMenuOpen && (
               <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-wa-sidebar-dark shadow-2xl rounded-xl py-2 z-50 border border-gray-100 dark:border-wa-border-dark animate-fade-in">
                  <button className="w-full px-4 py-2.5 text-left text-[14.5px] text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors" onClick={() => { setCurrentView('profile'); setIsMenuOpen(false); }}>
                     <UserIcon size={18} className="text-gray-400" />
                     Profile
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-[14.5px] text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors" onClick={() => { setCurrentView('settings'); setIsMenuOpen(false); }}>
                     <Settings size={18} className="text-gray-400" />
                     Settings
                  </button>
                  <div className="my-1 border-t border-gray-100 dark:border-wa-border-dark"></div>
                  <button onClick={logout} className="w-full px-4 py-2.5 text-left text-[14.5px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors font-semibold">
                     <LogOut size={18} />
                     Logout
                  </button>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="p-2 border-b border-gray-100 dark:border-wa-border-dark bg-white dark:bg-wa-sidebar-dark z-10">
        <div className="relative group">
           <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-wa-text-secondary-dark group-focus-within:text-wa-teal transition-all">
             <Search size={16} />
           </div>
           <input type="text" placeholder="Search or start new chat" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-wa-header-dark dark:text-wa-text-primary-dark rounded-xl py-2 pl-10 pr-10 focus:outline-none text-[14px] focus:ring-1 focus:ring-wa-green transition-all" />
           {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-wa-teal transition-all">
                <X size={14} />
              </button>
           )}
        </div>
      </div>

      {/* Filter Section (Tabs) */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar border-b border-gray-50 dark:border-wa-border-dark/30">
         <button onClick={() => setCurrentFilter('all')} className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${currentFilter === 'all' ? 'bg-wa-teal text-white' : 'bg-gray-50 dark:bg-wa-header-dark text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>All</button>
         <button onClick={() => setCurrentFilter('unread')} className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${currentFilter === 'unread' ? 'bg-wa-teal text-white' : 'bg-gray-50 dark:bg-wa-header-dark text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>Unread</button>
         <button onClick={() => setCurrentFilter('groups')} className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${currentFilter === 'groups' ? 'bg-wa-teal text-white' : 'bg-gray-50 dark:bg-wa-header-dark text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>Groups</button>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-wa-sidebar-dark transition-colors duration-500 custom-scrollbar">
        {contacts
          .filter(c => c.username.toLowerCase().includes(searchQuery.toLowerCase()))
          .filter(c => {
            if (currentFilter === 'unread') return unreadCounts[c._id] > 0;
            if (currentFilter === 'groups') return c.isGroup === true;
            return true; // 'all' filter
          })
          .length === 0 ? (
           <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-wa-header-dark rounded-full flex items-center justify-center mb-4 text-gray-400">
                {currentFilter === 'groups' ? <MessageSquare size={24} /> : <Search size={24} />}
              </div>
              <p className="text-[15px] dark:text-wa-text-primary-dark font-medium">
                {currentFilter === 'groups' ? 'No groups found' : 'No contacts found'}
              </p>
              <p className="text-[13px] text-gray-500 mt-1 max-w-[200px]">
                {currentFilter === 'groups' ? 'You are not part of any group chats yet.' : 'Try a different search term or check your connection.'}
              </p>
           </div>
        ) : contacts
          .filter(c => c.username.toLowerCase().includes(searchQuery.toLowerCase()))
          .filter(c => {
            if (currentFilter === 'unread') return unreadCounts[c._id] > 0;
            if (currentFilter === 'groups') return c.isGroup === true;
            return true;
          })
          .map((contact) => {
          const lastMsg = lastMessages[String(contact._id)];
          const isTyping = typingUsers[String(contact._id)];
          const isRecording = recordingUsers[String(contact._id)];
          const unreadCount = unreadCounts[String(contact._id)] || 0;
          return (
            <div
              key={contact._id}
              onClick={() => {
                setSelectedContact(contact);
                markAsRead(contact._id);
              }}
              className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-50 dark:border-wa-border-dark/50 transition-all group ${selectedContact?._id === contact._id ? 'bg-gray-100 dark:bg-wa-header-dark border-l-4 border-l-wa-green' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <div className="relative shrink-0">
                <img src={contact.avatar} alt="Avatar" className="w-[52px] h-[52px] rounded-full border border-gray-100 dark:border-wa-border-dark" />
                {onlineUsers.includes(String(contact._id)) && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-wa-green border-2 border-white dark:border-wa-sidebar-dark rounded-full shadow-sm"></div>
                )}
              </div>
              <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="font-semibold text-[15.5px] text-gray-800 dark:text-wa-text-primary-dark truncate flex items-center">
                    {contact.username}
                  </h3>
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${unreadCount > 0 ? 'text-wa-green' : (selectedContact?._id === contact._id ? 'text-wa-green' : 'text-gray-400')}`}>
                    {mutedContacts.includes(String(contact._id)) && <BellOff size={11} />}
                     {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex justify-end mt-1">
                  <UnreadBadge count={unreadCounts[String(contact._id)] || 0} />
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-[13.5px] truncate leading-snug flex-1 ${isTyping || isRecording ? 'text-wa-green italic font-medium' : 'text-gray-500 dark:text-wa-text-secondary-dark'}`}>
                    {isRecording ? 'recording voice...' : isTyping ? 'typing...' : (lastMsg ? lastMsg.content : contact.status)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
