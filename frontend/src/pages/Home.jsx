import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const Home = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [lastMessages, setLastMessages] = useState({}); // contactId -> { content, timestamp }
  const [selectedContact, setSelectedContact] = useState(null);
  const [blockedContacts, setBlockedContacts] = useState([]);
  const [mutedContacts, setMutedContacts] = useState([]);

  const toggleBlockContact = (contactId) => {
    setBlockedContacts(prev => {
      const newBlocked = prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId];
      if (user?.id) localStorage.setItem(`blocked_${user.id}`, JSON.stringify(newBlocked));
      return newBlocked;
    });
  };

  const toggleMuteContact = (contactId) => {
    setMutedContacts(prev => {
      const newMuted = prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId];
      if (user?.id) localStorage.setItem(`muted_${user.id}`, JSON.stringify(newMuted));
      return newMuted;
    });
  };

  useEffect(() => {
    if (user?.id) {
      try {
        const storedBlocked = JSON.parse(localStorage.getItem(`blocked_${user.id}`) || '[]');
        if (Array.isArray(storedBlocked)) setBlockedContacts(storedBlocked);
        const storedMuted = JSON.parse(localStorage.getItem(`muted_${user.id}`) || '[]');
        if (Array.isArray(storedMuted)) setMutedContacts(storedMuted);
      } catch(e) {
        console.error('Error loading preferences', e);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('chat-token');
        if (!token || !user) return;

        // 1. Fetch ALL users
        const res = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Use consistent comparison (strings)
        const otherUsers = res.data.filter(c => String(c._id) !== String(user.id));
        setContacts(otherUsers);

        // 2. Fetch the last messages for all conversations at once (New Efficient API)
        const lastMsgRes = await axios.get(`http://localhost:5000/api/messages/last-messages/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const lastMsgMap = {};
        lastMsgRes.data.forEach(msg => {
          const otherId = String(msg.senderId) === String(user.id) ? String(msg.receiverId) : String(msg.senderId);
          lastMsgMap[otherId] = {
            content: msg.type === 'voice' ? '🎙️ Voice Message' : (msg.type === 'image' ? '📷 Image' : msg.content),
            timestamp: msg.createdAt || msg.timestamp
          };
        });
        
        setLastMessages(lastMsgMap);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    if (user) fetchContacts();
  }, [user]);

  useEffect(() => {
    if (socket) {
      const receiveHandler = (message) => {
        const otherId = message.senderId === user.id ? message.receiverId : message.senderId;
        setLastMessages(prev => ({
          ...prev,
          [otherId]: {
            content: message.type === 'voice' ? '🎙️ Voice Message' : message.content,
            timestamp: message.createdAt || message.timestamp
          }
        }));
      };

      socket.on('receiveMessage', receiveHandler);
      return () => socket.off('receiveMessage', receiveHandler);
    }
  }, [socket, user.id]);

  const clearChat = async () => {
    if (!selectedContact) return;
    if (!window.confirm('Are you sure you want to clear this chat? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('chat-token');
      await axios.delete(`http://localhost:5000/api/messages/clear/${user.id}/${selectedContact._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Trigger a refresh or local clear
      window.location.reload(); // Simple way to clear all local states
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  return (
    <div className="flex h-screen bg-wa-bg-light dark:bg-wa-bg-dark transition-colors duration-500 overflow-hidden">
      {/* Main Container - WhatsApp Web Style Centered Layout */}
      <div className="flex w-full h-full max-w-[1600px] mx-auto shadow-2xl relative lg:my-[20px] lg:h-[calc(100vh-40px)] z-10">
        
        {/* Sidebar Holder */}
        <Sidebar 
          contacts={contacts} 
          lastMessages={lastMessages}
          selectedContact={selectedContact} 
          setSelectedContact={setSelectedContact} 
          clearChat={clearChat}
          mutedContacts={mutedContacts}
        />
        
        {/* Chat Area Holder */}
        <ChatWindow 
          selectedContact={selectedContact} 
          contacts={contacts}
          clearChat={clearChat}
          setSelectedContact={setSelectedContact}
          blockedContacts={blockedContacts}
          mutedContacts={mutedContacts}
          toggleBlockContact={toggleBlockContact}
          toggleMuteContact={toggleMuteContact}
        />
      </div>

      {/* Decorative Background Top Bar (WhatsApp Web style) */}
      <div className="absolute top-0 left-0 w-full h-[127px] bg-wa-teal dark:bg-wa-header-dark z-0 transition-colors duration-500"></div>
    </div>
  );
};

export default Home;
