import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { Send, Mic, Phone, Video, Search, MoreVertical, Volume2, Paperclip, Smile, CheckCheck, Play, Pause, ChevronDown, ChevronUp, FileIcon, ImageIcon, X, Clock, Trash2, Info, CornerUpLeft, Copy, CornerUpRight, Pin, Circle, Star, CheckSquare, Clipboard, Lock } from 'lucide-react';
import ContextMenu from './ContextMenu';
import DeleteModal from './DeleteModal';

const ChatWindow = ({ selectedContact, contacts = [], clearChat, setSelectedContact, blockedContacts = [], mutedContacts = [], toggleBlockContact, toggleMuteContact }) => {
  const { user, theme, chatWallpaper } = useAuth();
  const { socket, onlineUsers, typingUsers, recordingUsers, setUnreadCounts } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null); // Base64 for preview
  const [previewFile, setPreviewFile] = useState(null); // File object
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);
  const [callState, setCallState] = useState(null); // 'calling', 'incoming', 'active'
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState('voice');
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const localVideoRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedContent, setCopiedContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [bgContextMenu, setBgContextMenu] = useState(null);
  const [messageInfo, setMessageInfo] = useState(null); // For the Info Panel
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [starredIds, setStarredIds] = useState(new Set());
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [forwardSearch, setForwardSearch] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Voice/Speech Logic
  const { isRecording: isSTTRecording, startRecording: startSTT, stopRecording: stopSTT, transcript: liveTranscript, isFinal } = useSpeechToText();
  const { isRecording, recordingTime, startRecording: originalStartRecording, stopRecording: originalStopRecording, formatTime } = useVoiceRecorder(async (base64Audio) => {
    setTimeout(() => {
      handleSendMessage(null, liveTranscript, 'voice', base64Audio);
      stopSTT();
    }, 450);
  });

  const startRecording = () => {
    if (socket && selectedContact) {
      socket.emit('recording', { senderId: String(user.id), receiverId: String(selectedContact._id) });
    }
    originalStartRecording();
    startSTT();
  };

  const stopRecording = () => {
    if (socket && selectedContact) {
      socket.emit('stopRecording', { senderId: String(user.id), receiverId: String(selectedContact._id) });
    }
    originalStopRecording();
  };
  const { speak, stop: stopTTS, isPlaying } = useTextToSpeech();

  useEffect(() => {
    if (selectedContact) {
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('chat-token');

          const res = await axios.get(
            `http://localhost:5000/api/messages/${user.id}/${selectedContact._id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          setMessages(res.data);
          generateSmartReplies(res.data);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };

      fetchMessages();
    }
  }, [selectedContact, user.id]);
  // Fullscreen Keyboard Shortcuts (Ctrl+C to copy image)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && fullscreenImage) {
        try {
          const response = await fetch(fullscreenImage);
          const blob = await response.blob();
          const item = new ClipboardItem({ [blob.type]: blob });
          await navigator.clipboard.write([item]);
          showToast('Image copied to clipboard');
        } catch (err) {
          console.error("Shortcut copy failed:", err);
        }
      }
      if (e.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (socket) {
      const receiveHandler = (message) => {
        if (message.senderId === selectedContact?._id || message.receiverId === selectedContact?._id) {
          setMessages((prev) => [...prev, message]);
          generateSmartReplies([...messages, message]);

          // If we are looking at this chat, mark as read
          if (message.senderId === selectedContact?._id) {
            socket.emit('markAsRead', { senderId: selectedContact._id, receiverId: user.id });
            setUnreadCounts(prev => ({ ...prev, [selectedContact._id]: 0 }));
          }
        }
      };

      const readHandler = ({ readerId }) => {
        if (readerId === selectedContact?._id) {
          setMessages(prev => prev.map(m => m.senderId === user.id ? { ...m, read: true } : m));
        }
      };

      const incomingCallHandler = ({ from, type }) => {
        setIncomingCall({ from, type });
        setCallType(type);
        setCallState('incoming');
      };

      const callResponseHandler = ({ accepted, from }) => {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        if (accepted) {
          setCallState('active');
          startCallTimer();
        } else {
          setCallState(null);
        }
      };

      const callEndedHandler = () => {
        setCallState(null);
        stopCallTimer();
      };

      const messageDeletedHandler = ({ messageId, deletedForEveryone }) => {
        setMessages(prev => prev.map(m => 
          m._id === messageId 
            ? { ...m, deletedForEveryone, content: '🚫 This message was deleted', fileUrl: null, audioData: null, fileName: null } 
            : m
        ));
      };

      socket.on('receiveMessage', receiveHandler);
      socket.on('messagesRead', readHandler);
      socket.on('incomingCall', incomingCallHandler);
      socket.on('callResponse', callResponseHandler);
      socket.on('callEnded', callEndedHandler);
      socket.on('messageDeleted', messageDeletedHandler);

      return () => {
        socket.off('receiveMessage', receiveHandler);
        socket.off('messagesRead', readHandler);
        socket.off('incomingCall', incomingCallHandler);
        socket.off('callResponse', callResponseHandler);
        socket.off('callEnded', callEndedHandler);
        socket.off('messageDeleted', messageDeletedHandler);
      };
    }
  }, [socket, selectedContact, messages, user.id, setUnreadCounts]);

  // Video Stream Effect
  useEffect(() => {
    let streamReference = null;
    if ((callState === 'active' || callState === 'calling') && callType === 'video') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamReference = stream;
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Error accessing camera:", err));
    }

    return () => {
      if (streamReference) {
        streamReference.getTracks().forEach(track => track.stop());
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [callState, callType]);

  // Mark all existing unread messages as read when contact is selected
  useEffect(() => {
    if (socket && selectedContact) {
      socket.emit('markAsRead', { senderId: selectedContact._id, receiverId: user.id });
      setUnreadCounts(prev => ({ ...prev, [selectedContact._id]: 0 }));
    }
  }, [selectedContact, socket, user.id, setUnreadCounts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e, content = newMessage, type = 'text', audioData = null, fileUrl = null, fileName = null, fileType = null) => {
    if (e) e.preventDefault();
    if (!content.trim() && !audioData && !fileUrl) return;

    // Word limit check
    if (type === 'text' && content.trim().split(/\s+/).filter(Boolean).length > 12000) {
      alert('Message limit exceeded! Maximum allowed is 12,000 words.');
      return;
    }

    const tempId = Date.now().toString() + Math.random().toString();
    const messageData = {
      _tempId: tempId,
      senderId: user.id,
      receiverId: selectedContact._id,
      content: type === 'voice' ? (content || '') : content,
      type,
      audioData,
      transcript: type === 'voice' ? content : null,
      fileUrl,
      fileName,
      fileType,
      createdAt: new Date()
    };

    socket.emit('sendMessage', messageData, (savedMessage) => {
      setMessages(prev => prev.map(m => m._tempId === tempId ? savedMessage : m));
    });
    if (type === 'text') {
      socket.emit('stopTyping', { senderId: String(user.id), receiverId: String(selectedContact._id) });
      if (window.typingTimeout) clearTimeout(window.typingTimeout);
    }
    setMessages((prev) => [...prev, messageData]);
    setNewMessage('');
    setShowEmojiPicker(false);
    setReplyingTo(null);
  };

  const handlePasteImage = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
          setPreviewFile(file);
        };
        reader.readAsDataURL(file);
        break; // Only handle one image at a time
      }
    }
  };

  const handleSendPreview = () => {
    if (!previewImage) return;
    handleSendMessage(null, '', 'image', null, previewImage, `pasted-image-${Date.now()}.png`, previewFile?.type);
    setPreviewImage(null);
    setPreviewFile(null);
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

    return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  };

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCallDuration(0);
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const initiateCall = (type) => {
    if (!socket || !selectedContact) return;
    setCallType(type);
    setCallState('calling');
    socket.emit('callUser', { senderId: user.id, receiverId: selectedContact._id, type });
    
    // 30-second timeout for unanswered call
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = setTimeout(() => {
      endCall();
    }, 30000);
  };

  const handleCallResponse = (accepted) => {
    if (!socket || !incomingCall) return;
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    socket.emit('callResponse', { 
      senderId: incomingCall.from, 
      receiverId: user.id, 
      accepted,
      from: incomingCall.from,
      to: user.id,
      type: incomingCall.type
    });
    setCallType(incomingCall.type); 
    if (accepted) {
      setCallState('active');
      startCallTimer();
    } else {
      setCallState(null);
    }
  };

  const endCall = () => {
    if (!socket || !selectedContact) return;
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    socket.emit('endCall', { 
      senderId: user.id, 
      receiverId: selectedContact._id,
      type: callType,
      duration: formatDuration(callDuration)
    });
    setCallState(null);
    setCallType('voice'); 
    stopCallTimer();
  };

  const renderMessageWithDividers = () => {
    let lastDate = null;
    const filteredMessages = messages.filter(m =>
      (!searchQuery || (m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      !(m.deletedFor || []).includes(user.id)
    );

    return filteredMessages.map((msg, index) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const showDivider = msgDate !== lastDate;
      lastDate = msgDate;

      return (
        <React.Fragment key={index}>
          {showDivider && (
            <div className="flex justify-center my-6 sticky top-2 z-10 pointer-events-none">
              <span className="bg-white/90 dark:bg-wa-header-dark/90 text-gray-500 dark:text-wa-text-primary-dark text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-wa-border-dark backdrop-blur-sm tracking-widest">
                {formatMessageDate(msg.createdAt)}
              </span>
            </div>
          )}
          <div className="flex flex-col mb-2">
            <div className="flex items-center gap-2 w-full px-2">
              {isSelectionMode && (
                <div 
                  onClick={() => toggleSelection(msg._id)}
                  className={`w-6 h-6 rounded border-2 cursor-pointer flex items-center justify-center transition-all shrink-0 ${
                    selectedIds.has(msg._id) ? 'bg-wa-teal border-wa-teal' : 'border-gray-300 dark:border-white/20'
                  }`}
                >
                  {selectedIds.has(msg._id) && <CheckSquare size={14} className="text-white" />}
                </div>
              )}
              <div className={`flex-1 flex ${String(msg?.senderId) === String(user?.id || user?._id) ? 'justify-end' : 'justify-start'}`}>
                <div 
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                  onClick={() => isSelectionMode && toggleSelection(msg._id)}
                  className={`max-w-[70%] px-3 py-1.5 rounded-lg shadow-sm relative group ${
                    msg.deletedForEveryone ? 'bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10' :
                    (String(msg?.senderId) === String(user?.id || user?._id) ? 'bg-wa-bubble-me dark:bg-wa-bubble-me-dark rounded-tr-none bubble-tail-me' : 'bg-wa-bubble-other dark:bg-wa-bubble-other-dark rounded-tl-none bubble-tail-other')
                  } ${isSelectionMode && selectedIds.has(msg._id) ? 'ring-2 ring-wa-teal ring-opacity-50' : ''}`}
                >
                  {/* Media Rendering */}
                  {msg.deletedForEveryone ? (
                    <div className="flex items-center gap-2 text-gray-400 italic text-xs py-1">
                      <X size={14} className="opacity-50" />
                      <span>This message was deleted</span>
                    </div>
                  ) : (
                    <>
                      {msg.type === 'image' && (
                        <img 
                          src={msg.fileUrl} 
                          onClick={() => setFullscreenImage(msg.fileUrl)}
                          className="max-w-full rounded-md mb-2 cursor-pointer shadow-sm hover:scale-[1.01] transition-transform active:scale-95" 
                          alt="sent content" 
                        />
                      )}
                      {msg.type === 'file' && (
                        <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-md mb-2 hover:bg-black/10 transition-all border border-black/5 dark:border-white/5">
                          <FileIcon className="text-wa-teal" />
                          <span className="text-sm dark:text-wa-text-primary-dark truncate font-medium">{msg.fileName}</span>
                        </a>
                      )}

                      {msg.type === 'voice' && (
                        <div className="flex flex-col min-w-[240px]">
                          <div className="flex items-center gap-3 py-1">
                            <div className="bg-wa-teal/10 dark:bg-wa-teal/20 p-2.5 rounded-full cursor-pointer hover:bg-wa-teal/20 dark:hover:bg-wa-teal/30 transition-all shadow-sm group/play">
                              {playingAudioId === msg._id ? (
                                <Pause size={22} className="text-wa-teal" fill="currentColor" onClick={() => handleVoicePlayPause(msg._id, msg.audioData)} />
                              ) : (
                                <Play size={22} className="text-wa-teal" fill="currentColor" onClick={() => handleVoicePlayPause(msg._id, msg.audioData)} />
                              )}
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <div className="h-1 bg-gray-200 dark:bg-white/10 rounded-full relative overflow-hidden">
                                <div 
                                  className="absolute top-0 left-0 h-full bg-wa-teal shadow-[0_0_8px_rgba(18,140,126,0.5)] transition-[width] duration-300"
                                  style={{ width: `${playingAudioId === msg._id ? audioProgress : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            <Mic size={18} className="text-wa-teal" />
                          </div>
                        </div>
                      )}

                      {msg.type === 'call' && (
                        <div className="flex items-center gap-4 py-2 min-w-[220px]">
                          <div className={`p-3 rounded-full shrink-0 shadow-sm ${msg.fileType === 'Declined' ? 'bg-red-500/10' : 'bg-wa-teal/10'} border border-black/5 dark:border-white/5`}>
                            {msg.content.includes('Video') ? (
                              <Video size={24} className={msg.fileType === 'Declined' ? 'text-red-500' : 'text-wa-teal'} />
                            ) : (
                              <Phone size={24} className={msg.fileType === 'Declined' ? 'text-red-500' : 'text-wa-teal'} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[15px] dark:text-wa-text-primary-dark tracking-tight">{msg.content}</span>
                            <span className={`text-[12px] font-medium ${(msg.fileType === 'Call declined' || msg.fileType === 'Not answered') ? 'text-red-500/80' : 'text-gray-500 dark:text-wa-text-secondary-dark'}`}>
                               {msg.fileType === 'Completed' ? msg.fileName : msg.fileType}
                            </span>
                          </div>
                        </div>
                      )}

                      {msg.type !== 'call' && msg.content && <p className="text-[14.5px] pr-12 dark:text-wa-text-primary-dark leading-tight">{msg.content}</p>}
                    </>
                  )}

                  <div className="flex items-center justify-between gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      {starredIds.has(msg._id) && <Star size={10} className="text-gray-400 fill-current" />}
                      {pinnedIds.has(msg._id) && <Pin size={10} className="text-gray-400 fill-current" />}
                      <span className="text-[10.5px] text-gray-500 dark:text-wa-text-secondary-dark uppercase tracking-tighter">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {String(msg?.senderId) === String(user?.id || user?._id) && !msg.deletedForEveryone && (
                      msg.read ? (
                        <CheckCheck size={14} className="text-wa-blue" />
                      ) : (
                        <div className="text-gray-400">
                          <CheckCheck size={14} />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleVoicePlayPause = (msgId, audioData) => {
    if (playingAudioId === msgId) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setPlayingAudioId(msgId);
      } else {
        audioRef.current.pause();
        setPlayingAudioId(null); 
        setAudioProgress(0);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const newAudio = new Audio(audioData);
      audioRef.current = newAudio;
      newAudio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress(0);
      };
      newAudio.ontimeupdate = () => {
        const progress = (newAudio.currentTime / newAudio.duration) * 100;
        setAudioProgress(progress);
      };
      newAudio.play();
      setPlayingAudioId(msgId);
    }
  };

  const generateSmartReplies = (msgs) => {
    if (msgs.length === 0) return;
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg.senderId === user.id) return setSmartReplies([]);
    const text = (lastMsg.content || "").toLowerCase();
    let suggestions = ["Okay", "Got it"];
    if (text.includes("hello")) suggestions = ["Hi!", "How are you?"];
    setSmartReplies(suggestions);
  };

  const toggleSelection = (id) => {
    if (!id) return;
    const message = messages.find(m => m._id === id || m._tempId === id);
    if (message?.type === 'call') {
      showToast('Call logs cannot be deleted.');
      return;
    }
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      if (newSet.size === 0) setIsSelectionMode(false);
      return newSet;
    });
  };

  const handleBulkDelete = async (type) => {
    try {
      const token = localStorage.getItem('chat-token');
      const ids = Array.from(selectedIds);
      
      await axios.post(`http://localhost:5000/api/messages/delete-bulk`, {
        messageIds: ids,
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (type === 'me') {
        setMessages(prev => prev.filter(m => !selectedIds.has(m._id)));
      } else {
        setMessages(prev => prev.map(m => 
          selectedIds.has(m._id) && String(m.senderId) === String(user.id)
            ? { ...m, deletedForEveryone: true, content: '🚫 This message was deleted', fileUrl: null, audioData: null, fileName: null } 
            : m
        ));
      }
    } catch (err) {
      console.error('Error in bulk delete:', err);
    }
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setShowDeleteModal(false);
  };

  const handleContextMenu = (e, message) => {
    if (message.deletedForEveryone) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent background menu from overriding
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message
    });
  };

  const handleChatAreaContextMenu = (e) => {
    if (isSelectionMode) return;
    // Only show custom menu if we have content to paste or other background actions
    if (copiedContent || true) { // Force true for now to show 'Select all'
        e.preventDefault();
        setBgContextMenu({
          x: e.clientX,
          y: e.clientY
        });
    }
  };

  const contextMenuOptions = contextMenu ? [
    { 
      label: 'Message info', 
      icon: <Info size={18} />,
      onClick: () => setMessageInfo(contextMenu.message)
    },
    { 
      label: 'Reply', 
      icon: <CornerUpLeft size={18} />,
      onClick: () => setReplyingTo(contextMenu.message)
    },
    { 
      label: 'Copy', 
      icon: <Copy size={18} />,
      onClick: async () => {
        if (contextMenu.message.content) {
          navigator.clipboard.writeText(contextMenu.message.content);
          setCopiedContent(contextMenu.message.content);
        } else if (contextMenu.message.type === 'image') {
          // Robust Image Copy (Blob)
          try {
            const response = await fetch(contextMenu.message.fileUrl);
            const blob = await response.blob();
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            setCopiedContent(contextMenu.message.fileUrl); // Keep URL for internal app paste
            showToast('Image copied to clipboard');
          } catch (err) {
            // Fallback to URL copy
            navigator.clipboard.writeText(contextMenu.message.fileUrl);
            setCopiedContent(contextMenu.message.fileUrl);
          }
        }
      }
    },
    { 
      label: 'Forward', 
      icon: <CornerUpRight size={18} />,
      onClick: () => {
        setForwardMessage(contextMenu.message);
        setShowForwardModal(true);
      }
    },
    { 
      label: 'Pin', 
      icon: <Pin size={18} />,
      onClick: () => {
        setPinnedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(contextMenu.message._id)) {
            newSet.delete(contextMenu.message._id);
            showToast('Message unpinned');
          } else {
            newSet.add(contextMenu.message._id);
            showToast('Message pinned');
          }
          return newSet;
        });
      }
    },
    { 
      label: 'Star', 
      icon: <Star size={18} />,
      onClick: () => {
        setStarredIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(contextMenu.message._id)) {
            newSet.delete(contextMenu.message._id);
            showToast('Removed from starred');
          } else {
            newSet.add(contextMenu.message._id);
            showToast('Message starred');
          }
          return newSet;
        });
      }
    },
    { 
      label: 'Select', 
      icon: <CheckSquare size={18} />,
      onClick: () => {
        setIsSelectionMode(true);
        setSelectedIds(new Set([contextMenu.message._id]));
      }
    },
    { 
      label: 'Delete', 
      icon: <Trash2 size={18} className="text-red-500" />,
      divider: true,
      danger: true,
      onClick: () => {
        setIsSelectionMode(true);
        setSelectedIds(new Set([contextMenu.message._id]));
        setShowDeleteModal(true);
      }
    }
  ].filter(opt => !(opt.label === 'Delete' && contextMenu.message.type === 'call')) : [];

  const bgMenuOptions = [
    { 
      label: 'Paste', 
      icon: <Clipboard size={18} />, 
      onClick: () => {
        if (copiedContent) {
          // If it looks like an image URL from our internal copy, trigger preview
          if (copiedContent.startsWith('data:image/') || copiedContent.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
            setPreviewImage(copiedContent);
          } else {
            setNewMessage(prev => prev + copiedContent);
          }
        }
      }
    }
  ].filter(opt => opt.label !== 'Paste' || copiedContent);

  if (!selectedContact) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-wa-bg-light dark:bg-wa-bg-dark transition-all overflow-hidden relative">
      <div className="opacity-10 absolute inset-0 whatsapp-chat-bg-layer pointer-events-none"></div>
      <h1 className="text-4xl font-light text-gray-300 dark:text-wa-text-primary-dark mb-4 z-10 transition-all duration-1000 animate-fade-in">WhatsApp Pro</h1>
      <p className="text-gray-400 dark:text-wa-text-secondary-dark text-sm z-10 tracking-wide font-medium flex items-center gap-2">
        <Clock size={16} /> Encrypted and Secure
      </p>
    </div>
  );

  return (
    <div 
      className="flex-1 flex flex-col bg-wa-chat-bg dark:bg-wa-bg-dark relative overflow-hidden h-full"
      onContextMenu={handleChatAreaContextMenu}
    >
      {/* Header */}
      {isSelectionMode ? (
        <div className="h-[60px] bg-wa-header-bg dark:bg-[#111b21] flex items-center justify-between px-6 shrink-0 relative z-20 border-b dark:border-white/5 shadow-md animate-fade-in">
           <div className="flex items-center gap-6">
              <X 
                size={24} 
                className="text-gray-500 dark:text-[#d1d7db] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 rounded-full" 
                onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} 
              />
              <span className="font-semibold text-lg dark:text-[#d1d7db]">{selectedIds.size} selected</span>
           </div>
           <div className="flex items-center gap-6">
              <Trash2 
                size={22} 
                className="text-gray-500 dark:text-[#d1d7db] cursor-pointer hover:text-red-500 transition-colors" 
                onClick={() => setShowDeleteModal(true)}
              />
              <MoreVertical size={22} className="text-gray-500 dark:text-[#d1d7db] cursor-pointer" />
           </div>
        </div>
      ) : (
        <div className="h-[60px] bg-wa-header-bg dark:bg-wa-header-dark flex items-center justify-between px-4 shrink-0 relative z-20 border-b dark:border-wa-border-dark shadow-sm">
          <div className="flex items-center gap-3">
            <img src={selectedContact.avatar} className="w-10 h-10 rounded-full border border-gray-100 dark:border-wa-border-dark" alt="Contact Avatar" />
            <div className="flex flex-col">
              <span className="font-semibold dark:text-wa-text-primary-dark text-[15.5px]">{selectedContact.username}</span>
              <span className="text-xs font-medium tracking-wide">
                {recordingUsers[String(selectedContact._id)] ? (
                  <span className="text-green-500">recording voice...</span>
                ) : typingUsers[String(selectedContact._id)] ? (
                  <span className="text-wa-teal">typing...</span>
                ) : onlineUsers.includes(String(selectedContact._id)) ? (
                  <span className="text-wa-teal">online</span>
                ) : (
                  <span className="text-gray-400">offline</span>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-gray-800 dark:text-[#aebac1]">
            <Video size={22} className="hover:text-wa-teal cursor-pointer" onClick={() => initiateCall('video')} />
            <Phone size={21} className="hover:text-wa-teal cursor-pointer" onClick={() => initiateCall('voice')} />
            <Search size={21} className={`hover:text-wa-teal cursor-pointer ${isSearching ? 'text-wa-teal' : ''}`} onClick={() => setIsSearching(!isSearching)} />
            <div className="relative" ref={headerMenuRef}>
               <MoreVertical size={22} className="hover:text-wa-teal cursor-pointer" onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} />
               {isHeaderMenuOpen && (
                 <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-wa-sidebar-dark shadow-xl rounded py-2 z-50 border border-gray-100 dark:border-wa-border-dark animate-fade-in text-[14.5px]">
                    <button className="w-full px-5 py-2.5 text-left text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => { setIsHeaderMenuOpen(false); setShowContactInfo(true); }}>Contact info</button>
                    <button className="w-full px-5 py-2.5 text-left text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => { setIsHeaderMenuOpen(false); setIsSelectionMode(true); }}>Select messages</button>
                    <button className="w-full px-5 py-2.5 text-left text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => { setIsHeaderMenuOpen(false); if(toggleMuteContact) toggleMuteContact(selectedContact._id); }}>
                      {mutedContacts?.includes(selectedContact._id) ? 'Unmute notifications' : 'Mute notifications'}
                    </button>
                    <button className="w-full px-5 py-2.5 text-left text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => { setIsHeaderMenuOpen(false); if(setSelectedContact) setSelectedContact(null); }}>Close chat</button>
                    <div className="my-1 border-t border-gray-100 dark:border-wa-border-dark"></div>
                    <button className="w-full px-5 py-2.5 text-left text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => { setIsHeaderMenuOpen(false); showToast('Report submitted'); }}>Report</button>
                    <button className="w-full px-5 py-2.5 text-left text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => { setIsHeaderMenuOpen(false); if(toggleBlockContact) toggleBlockContact(selectedContact._id); }}>
                      {blockedContacts?.includes(selectedContact._id) ? 'Unblock' : 'Block'}
                    </button>
                    <button className="w-full px-5 py-2.5 text-left text-gray-700 dark:text-wa-text-primary-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => { setIsHeaderMenuOpen(false); if(clearChat) clearChat(); }}>Clear chat</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar Overlay */}
      {isSearching && (
        <div className="bg-wa-header-bg dark:bg-wa-header-dark px-4 py-2 flex items-center gap-3 border-b dark:border-wa-border-dark animate-fade-in">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-white dark:bg-wa-sidebar-dark dark:text-wa-text-primary-dark rounded-lg py-1.5 pl-9 pr-8 text-sm focus:outline-none"
            />
          </div>
          <X size={18} className="text-gray-400 cursor-pointer hover:text-wa-teal" onClick={() => { setIsSearching(false); setSearchQuery(''); }} />
        </div>
      )}

      {/* Call Overlays */}
      {callState && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-md transition-all animate-fade-in">
          <img src={callState === 'incoming' ? 'https://cdn-icons-png.flaticon.com/512/149/149071.png' : selectedContact.avatar} className="w-32 h-32 rounded-full border-4 border-wa-teal mb-6 shadow-2xl" alt="Caller" />
          <h2 className="text-2xl font-semibold mb-2">
            {callState === 'incoming' 
              ? `Incoming ${callType.charAt(0).toUpperCase() + callType.slice(1)} Call` 
              : selectedContact.username}
          </h2>
          {callState !== 'incoming' && (
            <p className="text-wa-teal font-medium mb-12 uppercase tracking-widest text-xs">
              {callState === 'calling' ? (onlineUsers.includes(String(selectedContact._id)) ? 'Ringing...' : 'Calling...') : callState === 'active' ? formatDuration(callDuration) : ''}
            </p>
          )}

          {(callState === 'active' || callState === 'calling') && callType === 'video' && (
             <video ref={localVideoRef} autoPlay playsInline muted className="w-[80%] max-h-[60%] rounded-2xl mb-12 object-cover border-4 border-wa-teal/50 shadow-2xl mirror" />
          )}

          <div className="flex gap-12">
            {callState === 'incoming' ? (
              <>
                <button onClick={() => handleCallResponse(false)} className="p-5 bg-red-500 rounded-full hover:bg-red-600 transition-all shadow-lg hover:scale-110 active:scale-95">
                  <X size={32} />
                </button>
                <button onClick={() => handleCallResponse(true)} className="p-5 bg-wa-green rounded-full hover:bg-wa-green/80 transition-all shadow-lg hover:scale-110 active:scale-95">
                  <Phone size={32} />
                </button>
              </>
            ) : (
              <button onClick={endCall} className="p-5 bg-red-500 rounded-full hover:bg-red-600 transition-all shadow-lg hover:scale-110 active:scale-95">
                <X size={32} fill="currentColor" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Overlay */}
      {previewImage && (
        <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col backdrop-blur-md animate-fade-in">
          <div className="h-[60px] flex items-center justify-between px-6 text-white bg-black/20 shrink-0">
             <div className="flex items-center gap-4">
                <button onClick={() => setPreviewImage(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                   <X size={24} />
                </button>
                <span className="font-semibold tracking-wide text-lg uppercase">Send Image</span>
             </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
             <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 animate-scale-up" />
          </div>
          <div className="p-8 flex justify-center items-center gap-6 bg-black/20 shrink-0">
             <button
               onClick={() => setPreviewImage(null)}
               className="px-8 py-3 rounded-full text-white font-bold hover:bg-white/10 transition-all border border-white/20 uppercase tracking-widest text-xs"
             >
               Cancel
             </button>
             <button
               onClick={handleSendPreview}
               className="px-10 py-3 bg-wa-teal rounded-full text-white font-bold hover:bg-wa-teal/80 transition-all shadow-lg flex items-center gap-3 uppercase tracking-widest text-xs hover:scale-105 active:scale-95"
             >
               Send <Send size={16} />
             </button>
          </div>
        </div>
      )}

      {/* Message Area */}
      <div 
        className={`flex-1 overflow-y-auto p-4 custom-scrollbar relative ${!chatWallpaper ? 'bg-wa-bg-light dark:bg-wa-bg-dark/20' : ''}`}
        style={chatWallpaper ? { backgroundColor: chatWallpaper } : {}}
      >
        <div className="opacity-10 absolute inset-0 whatsapp-chat-bg pointer-events-none z-[-1]"></div>
        {renderMessageWithDividers()}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {blockedContacts?.includes(selectedContact._id) ? (
        <div className="bg-wa-header-bg dark:bg-wa-header-dark p-6 flex items-center justify-center border-t dark:border-wa-border-dark transition-colors duration-500 cursor-pointer shadow-inner" onClick={() => { if(toggleBlockContact) toggleBlockContact(selectedContact._id); }}>
           <span className="text-gray-500 dark:text-wa-text-secondary-dark font-medium px-4 py-2 bg-black/5 dark:bg-white/5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-wa-border-dark transition-all">
             You blocked this contact. Tap to unblock.
           </span>
        </div>
      ) : (
      <div className="bg-wa-header-bg dark:bg-wa-header-dark p-3 relative border-t dark:border-wa-border-dark transition-colors duration-500">
        {showEmojiPicker && (
          <div className="absolute bottom-[70px] left-4 z-50 shadow-2xl animate-fade-in" ref={emojiPickerRef}>
            <EmojiPicker theme={theme === 'dark' ? 'dark' : 'light'} onEmojiClick={handleEmojiClick} />
          </div>
        )}

        {replyingTo && (
          <div className="mx-4 mb-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg border-l-4 border-wa-teal flex items-center justify-between animate-fade-in shadow-inner">
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-wa-teal">
                {String(replyingTo.senderId) === String(user.id) ? 'You' : (selectedContact?.username || 'Contact')}
              </span>
              <p className="text-sm text-gray-500 dark:text-wa-text-secondary-dark truncate">
                {replyingTo.content || (replyingTo.type === 'image' ? '📷 Image' : replyingTo.type === 'voice' ? '🎤 Voice message' : '📎 File')}
              </p>
            </div>
            <X 
              size={18} 
              className="text-gray-400 cursor-pointer hover:text-red-500 transition-colors" 
              onClick={() => setReplyingTo(null)} 
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Smile size={24} className="text-gray-500 cursor-pointer hover:text-wa-teal transition-all" onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
            <Paperclip size={22} className="text-gray-500 cursor-pointer hover:text-wa-teal transition-all rotate-45" onClick={() => fileInputRef.current.click()} />
          </div>

          <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => {
              const type = file.type.startsWith('image/') ? 'image' : 'file';
              handleSendMessage(null, '', type, null, reader.result, file.name, file.type);
            };
            reader.readAsDataURL(file);
          }} />

          {isRecording ? (
            <div className="flex-1 flex justify-between bg-white dark:bg-wa-sidebar-dark px-4 py-3 rounded-xl border border-wa-green shadow-inner animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                <span className="text-red-500 font-bold tracking-widest">{formatTime(recordingTime)}</span>
              </div>
              <p className="text-xs text-gray-400 italic font-medium">"{(liveTranscript || 'Listening...').slice(0, 45)}..."</p>
              <button onClick={stopRecording} className="text-wa-teal font-extrabold hover:scale-105 active:scale-95 transition-all text-xs uppercase underline">FINISH</button>
            </div>
          ) : (
            <form className="flex-1" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onContextMenu={handleChatAreaContextMenu}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (socket && selectedContact) {
                    socket.emit('typing', { senderId: String(user.id), receiverId: String(selectedContact._id) });

                    if (window.typingTimeout) clearTimeout(window.typingTimeout);
                    window.typingTimeout = setTimeout(() => {
                      socket.emit('stopTyping', { senderId: String(user.id), receiverId: String(selectedContact._id) });
                    }, 2000);
                  }
                }}
                placeholder="Type a message"
                onPaste={handlePasteImage}
                className="w-full bg-white dark:bg-wa-sidebar-dark dark:text-wa-text-primary-dark rounded-xl px-5 py-2.5 focus:outline-none focus:ring-1 focus:ring-wa-green transition-all shadow-sm border dark:border-transparent"
              />
            </form>
          )}

          <button onClick={isRecording ? stopRecording : (newMessage.trim() ? handleSendMessage : startRecording)} className={`p-3 rounded-full transition-all transform active:scale-90 shadow-md ${newMessage.trim() || isRecording ? 'bg-wa-teal text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}>
            {newMessage.trim() ? <Send size={20} /> : <Mic size={24} />}
          </button>
        </div>
      </div>
      )}

      {/* Overlays / Modals / Panels */}
      {messageInfo && (
        <div className="absolute inset-y-0 right-0 w-[400px] bg-white dark:bg-wa-sidebar-dark shadow-2xl z-[100] animate-slide-in flex flex-col border-l dark:border-white/5">
          <div className="h-[60px] bg-wa-header-bg dark:bg-[#111b21] flex items-center px-6 gap-6 sticky top-0 border-b dark:border-white/5 shrink-0">
            <X className="cursor-pointer text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 p-1 rounded-full" onClick={() => setMessageInfo(null)} />
            <h3 className="font-semibold text-lg dark:text-[#d1d7db]">Message info</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-[#0b141a]">
            {/* Authentic WhatsApp style Message Info */}
            <div className={`flex ${String(messageInfo.senderId) === String(user.id) ? 'justify-end' : 'justify-start'} mb-8`}>
               <div className={`p-3 rounded-lg shadow-sm max-w-[90%] relative ${String(messageInfo.senderId) === String(user.id) ? 'bg-wa-bubble-me dark:bg-wa-bubble-me-dark bubble-tail-me' : 'bg-wa-bubble-other dark:bg-wa-bubble-other-dark bubble-tail-other'}`}>
                  <p className="text-[14.5px] dark:text-wa-text-primary-dark pr-12">{messageInfo.content || (messageInfo.type === 'image' ? '📷 Image' : 'Media message')}</p>
                  <span className="text-[10px] text-gray-400 absolute bottom-1 right-2 uppercase">
                    {new Date(messageInfo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
            </div>
            
            <div className="space-y-0.5 rounded-lg overflow-hidden border dark:border-white/5 shadow-sm">
               <div className="bg-white dark:bg-wa-sidebar-dark p-5 flex items-center gap-5">
                  <CheckCheck size={20} className="text-wa-blue" />
                  <div className="flex flex-col flex-1">
                     <span className="text-[16px] dark:text-[#e9edef]">Read</span>
                     <span className="text-[13px] text-gray-500">{messageInfo.read ? new Date(messageInfo.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Pending...'}</span>
                  </div>
               </div>
               <div className="h-[1px] bg-gray-100 dark:bg-white/5 mx-5"></div>
               <div className="bg-white dark:bg-wa-sidebar-dark p-5 flex items-center gap-5">
                  <CheckCheck size={20} className="text-gray-400" />
                  <div className="flex flex-col flex-1">
                     <span className="text-[16px] dark:text-[#e9edef]">Delivered</span>
                     <span className="text-[13px] text-gray-500">{new Date(messageInfo.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showForwardModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#202c33] w-full max-w-[450px] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px] border dark:border-white/10">
            <div className="bg-wa-teal dark:bg-[#202c33] text-white dark:text-[#d1d7db] p-5 flex items-center gap-6 border-b dark:border-white/10 shrink-0">
              <X className="cursor-pointer hover:bg-black/10 p-1 rounded-full transition-all" onClick={() => { setShowForwardModal(false); setForwardMessage(null); }} />
              <h3 className="text-lg font-semibold">Forward message to</h3>
            </div>
            
            <div className="p-3 bg-white dark:bg-[#111b21] shrink-0">
              <div className="relative flex items-center bg-gray-100 dark:bg-[#202c33] rounded-lg px-3 py-2.5 focus-within:ring-1 focus-within:ring-wa-teal transition-all">
                <Search size={18} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search contacts" 
                  className="bg-transparent border-none focus:outline-none text-sm w-full px-3 dark:text-[#d1d7db]"
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21] custom-scrollbar">
               {contacts.filter(c => c.username.toLowerCase().includes(forwardSearch.toLowerCase())).map(contact => (
                 <div 
                  key={contact._id}
                  onClick={() => {
                    handleSendMessage(null, forwardMessage.content, forwardMessage.type, forwardMessage.audioData, forwardMessage.fileUrl, forwardMessage.fileName, forwardMessage.fileType);
                    setShowForwardModal(false);
                    setForwardMessage(null);
                    showToast('Message forwarded');
                  }}
                  className="flex items-center gap-4 p-4 hover:bg-gray-100 dark:hover:bg-[#202c33] cursor-pointer border-b border-gray-50 dark:border-white/5 transition-all group"
                 >
                   <img src={contact.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-full border dark:border-white/10 shadow-sm" alt={contact.username} />
                   <div className="flex-1 pb-0">
                      <h4 className="text-[17px] dark:text-[#e9edef] font-medium leading-none mb-1">{contact.username}</h4>
                      <p className="text-[13px] text-gray-500">Available</p>
                   </div>
                   <div className="w-10 h-10 flex items-center justify-center rounded-full bg-wa-teal/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Send size={18} className="text-wa-teal" />
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenuOptions}
          onClose={() => setContextMenu(null)}
        />
      )}
      {bgContextMenu && (
        <ContextMenu
          x={bgContextMenu.x}
          y={bgContextMenu.y}
          options={bgMenuOptions}
          onClose={() => setBgContextMenu(null)}
        />
      )}

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setIsSelectionMode(false); setSelectedIds(new Set()); }}
        onDeleteMe={() => handleBulkDelete('me')}
        onDeleteEveryone={() => handleBulkDelete('everyone')}
        count={selectedIds.size}
        canDeleteForEveryone={Array.from(selectedIds).every(id => {
          const msg = messages.find(m => m._id === id);
          return msg && String(msg.senderId) === String(user.id);
        })}
      />

      {fullscreenImage && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center backdrop-blur-xl animate-fade-in p-10">
          <div className="absolute top-0 left-0 w-full h-[70px] bg-black/40 flex items-center justify-between px-8 text-white">
             <div className="flex items-center gap-4">
                <img src={selectedContact?.avatar} className="w-10 h-10 rounded-full" alt="avatar" />
                <div className="flex flex-col">
                   <span className="font-semibold">{selectedContact?.username}</span>
                   <span className="text-xs opacity-70">Shared image</span>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <a href={fullscreenImage} download="whatsapp-clone-image.jpg" className="hover:bg-white/10 p-2 rounded-full transition-all">
                   <ChevronDown size={28} className="rotate-180" />
                </a>
                <X className="cursor-pointer hover:bg-white/10 p-2 rounded-full transition-all" size={40} onClick={() => setFullscreenImage(null)} />
             </div>
          </div>
          <img src={fullscreenImage} className="max-w-full max-h-full object-contain shadow-2xl animate-scale-up" alt="fullscreen" />
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[400] bg-[#323232] text-white px-6 py-2.5 rounded-md shadow-2xl animate-bounce-subtle flex items-center gap-3 transition-opacity">
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Contact Info Panel Overlay */}
      {showContactInfo && (
        <div className="absolute top-0 right-0 h-full w-[400px] bg-wa-chat-bg dark:bg-wa-bg-dark shadow-2xl border-l border-gray-200 dark:border-wa-border-dark flex flex-col shrink-0 animate-slide-left z-50">
           <div className="h-[60px] bg-wa-header-bg dark:bg-wa-header-dark flex items-center gap-6 px-6 shrink-0 border-b dark:border-wa-border-dark">
              <X size={24} className="text-gray-500 cursor-pointer hover:text-wa-teal transition-colors" onClick={() => setShowContactInfo(false)} />
              <h2 className="font-semibold text-lg dark:text-wa-text-primary-dark">Contact info</h2>
           </div>
           <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-wa-bg-dark custom-scrollbar">
              <div className="bg-white dark:bg-wa-sidebar-dark py-8 px-6 flex flex-col items-center justify-center shadow-sm mb-2">
                 <img src={selectedContact?.avatar} alt="Avatar" className="w-[200px] h-[200px] rounded-full object-cover shadow-lg mb-4 border-4 border-white dark:border-wa-border-dark" />
                 <h1 className="text-2xl font-normal dark:text-wa-text-primary-dark">{selectedContact?.username}</h1>
                 <p className="text-gray-500 mt-1">{selectedContact?.email}</p>
                 <div className="flex gap-6 mt-6 w-full justify-center">
                    <div className="flex flex-col items-center gap-2 cursor-pointer text-wa-teal group">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-gray-200 dark:border-wa-border-dark group-hover:bg-gray-50 dark:group-hover:bg-white/5 transition-all shadow-sm">
                         <Phone size={24} />
                      </div>
                      <span className="text-[13px] font-medium">Audio</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 cursor-pointer text-wa-teal group">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-gray-200 dark:border-wa-border-dark group-hover:bg-gray-50 dark:group-hover:bg-white/5 transition-all shadow-sm">
                         <Video size={24} />
                      </div>
                      <span className="text-[13px] font-medium">Video</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 cursor-pointer text-wa-teal group" onClick={() => { setShowContactInfo(false); setIsSearching(true); }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-gray-200 dark:border-wa-border-dark group-hover:bg-gray-50 dark:group-hover:bg-white/5 transition-all shadow-sm">
                         <Search size={24} />
                      </div>
                      <span className="text-[13px] font-medium">Search</span>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-wa-sidebar-dark py-4 px-6 shadow-sm mb-2">
                 <h3 className="text-[14px] font-medium text-wa-teal mb-2">About</h3>
                 <p className="text-[16px] dark:text-wa-text-primary-dark">{selectedContact?.status || "Hey there! I am using WhatsApp."}</p>
              </div>

              <div className="bg-white dark:bg-wa-sidebar-dark py-2 shadow-sm mb-8">
                 <button className="w-full px-6 py-4 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-red-500 text-[15px] font-medium" onClick={() => { if(toggleBlockContact) toggleBlockContact(selectedContact._id); }}>
                    <Lock size={22} className="group-hover:scale-110 transition-transform" />
                    <span>{blockedContacts?.includes(selectedContact._id) ? 'Unblock' : 'Block'} {selectedContact?.username}</span>
                 </button>
                 <button className="w-full px-6 py-4 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-red-500 text-[15px] font-medium" onClick={() => { setShowContactInfo(false); if(clearChat) clearChat(); }}>
                    <Trash2 size={22} className="group-hover:scale-110 transition-transform" />
                    <span>Clear chat</span>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
