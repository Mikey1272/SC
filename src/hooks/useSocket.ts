import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, User, Room } from '../types';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [countryRestricted, setCountryRestricted] = useState<string | null>(null);

  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : 'https://your-backend-url.com';
      
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('room-data', (data: { room: Room; messages: Message[]; users: User[] }) => {
      setRoom(data.room);
      setMessages(data.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
      setUsers(data.users);
    });

    socketRef.current.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp)
      }]);
    });

    socketRef.current.on('user-joined', (user: User) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    socketRef.current.on('user-left', (user: User) => {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    });

    socketRef.current.on('active-users-updated', (count: number) => {
      setRoom(prev => prev ? { ...prev, activeUsers: count } : null);
    });

    socketRef.current.on('message-liked', (data: { messageId: string; likes: number }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, likes: data.likes } : msg
      ));
    });

    socketRef.current.on('user-typing', (data: { userId: string; username: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.includes(data.username) ? prev : [...prev, data.username];
        } else {
          return prev.filter(name => name !== data.username);
        }
      });
    });

    socketRef.current.on('moderation-warning', (data: { violations: string[]; originalMessage: string; cleanMessage: string }) => {
      console.warn('Message moderated:', data);
      if (window.showToast) {
        window.showToast('Your message was moderated for: ' + data.violations.join(', '), 'warning');
      }
    });

    socketRef.current.on('auth-error', (data: { message: string }) => {
      console.error('Authentication error:', data.message);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    });

    socketRef.current.on('banned', (data: { reason: string }) => {
      alert(`You have been banned: ${data.reason}`);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    });

    socketRef.current.on('country-restricted', (data: { message: string; assignedCountry: string }) => {
      setCountryRestricted(data.assignedCountry);
      if (window.showToast) {
        window.showToast(data.message, 'error');
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinRoom = (userId: string, username: string, country: string) => {
    const token = localStorage.getItem('authToken');
    socketRef.current?.emit('join-room', { userId, username, country, token });
  };

  const sendMessage = (userId: string, text: string, country: string) => {
    const token = localStorage.getItem('authToken');
    socketRef.current?.emit('send-message', { userId, text, country, token });
  };

  const likeMessage = (messageId: string, country: string) => {
    const token = localStorage.getItem('authToken');
    socketRef.current?.emit('like-message', { messageId, country, token });
  };

  const setTyping = (userId: string, country: string, isTyping: boolean) => {
    const token = localStorage.getItem('authToken');
    socketRef.current?.emit('typing', { userId, country, isTyping, token });
  };

  return {
    isConnected,
    messages,
    users,
    room,
    typingUsers,
    countryRestricted,
    joinRoom,
    sendMessage,
    likeMessage,
    setTyping
  };
};

declare global {
  interface Window {
    showToast?: (message: string, type: 'success' | 'error' | 'warning') => void;
  }
}