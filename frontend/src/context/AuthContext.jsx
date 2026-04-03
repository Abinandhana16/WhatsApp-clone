import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [chatWallpaper, setChatWallpaper] = useState(localStorage.getItem('chat-wallpaper') || null);

  useEffect(() => {
    const token = localStorage.getItem('chat-token');
    const storedUser = localStorage.getItem('chat-user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const savedWallpaper = localStorage.getItem('chat-wallpaper');
    if (savedWallpaper) {
      setChatWallpaper(savedWallpaper);
      document.documentElement.style.setProperty('--chat-wallpaper', savedWallpaper);
    } else {
      document.documentElement.style.removeProperty('--chat-wallpaper');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const updateChatWallpaper = (color) => {
    if (!color) {
      localStorage.removeItem('chat-wallpaper');
      document.documentElement.style.removeProperty('--chat-wallpaper');
    } else {
      localStorage.setItem('chat-wallpaper', color);
      document.documentElement.style.setProperty('--chat-wallpaper', color);
    }
    setChatWallpaper(color);
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('chat-token', token);
      localStorage.setItem('chat-user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { username, email, password });
      const { token, user } = res.data;
      localStorage.setItem('chat-token', token);
      localStorage.setItem('chat-user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('chat-token');
    localStorage.removeItem('chat-user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('chat-user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, theme, toggleTheme, updateUser, chatWallpaper, updateChatWallpaper }}>
      {children}
    </AuthContext.Provider>
  );
};
