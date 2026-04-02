import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // senderId -> boolean
  const [recordingUsers, setRecordingUsers] = useState({}); // senderId -> boolean
  const [unreadCounts, setUnreadCounts] = useState({}); // senderId -> count

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('join', String(user.id));
      });

      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users.map(id => String(id)));
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected, clearing states');
        setTypingUsers({});
        setRecordingUsers({});
      });

      newSocket.on('userTyping', ({ senderId }) => {
        console.log('User typing received:', senderId);
        setTypingUsers(prev => ({ ...prev, [String(senderId)]: true }));
      });

      newSocket.on('userStoppedTyping', ({ senderId }) => {
        console.log('User stopped typing received:', senderId);
        setTypingUsers(prev => ({ ...prev, [String(senderId)]: false }));
      });
      
      newSocket.on('userRecording', ({ senderId }) => {
        console.log('User recording received:', senderId);
        setRecordingUsers(prev => ({ ...prev, [String(senderId)]: true }));
      });
      
      newSocket.on('userStoppedRecording', ({ senderId }) => {
        console.log('User stopped recording received:', senderId);
        setRecordingUsers(prev => ({ ...prev, [String(senderId)]: false }));
      });

      newSocket.on('receiveMessage', (msg) => {
        // Only increase unread if NOT current chat
        if (msg.senderId !== user.id) {
          setUnreadCounts(prev => ({
            ...prev,
            [msg.senderId]: (prev[msg.senderId] || 0) + 1
          }));
        }
      });
      newSocket.on('messagesRead', ({ readerId }) => {
        setUnreadCounts(prev => ({
          ...prev,
          [readerId]: 0
        }));
      });

      const fetchUnreadCounts = async () => {
        if (!user) return;
        try {
          const token = localStorage.getItem('chat-token');
          const res = await axios.get(`http://localhost:5000/api/messages/unread/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Unread counts API response:', res.data);
          const counts = {};
          res.data.forEach(item => {
            // Ensure ID is a string for stable mapping
            const senderId = String(item._id);
            counts[senderId] = item.count;
          });
          setUnreadCounts(counts);
        } catch (err) {
          console.error('Error fetching unread counts:', err);
        }
      };

      fetchUnreadCounts();

      return () => newSocket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers, recordingUsers, unreadCounts, setUnreadCounts }}>
      {children}
    </SocketContext.Provider>
  );
};
