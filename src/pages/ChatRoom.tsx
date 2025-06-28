import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatContext } from '../context/ChatContext';
import { useSocket } from '../hooks/useSocket';
import { 
  Send, 
  Heart, 
  MessageSquare, 
  Users, 
  Settings, 
  Search, 
  Smile, 
  Paperclip, 
  Image as ImageIcon,
  AlertTriangle,
  Flag,
  MoreVertical,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { countryDetails } from '../data/countries';
import { v4 as uuidv4 } from 'uuid';

const ChatRoom = () => {
  const { country, mode } = useParams<{ country: string; mode: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, username } = useChatContext();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userId] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || uuidv4();
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingUser, setReportingUser] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const countryData = countryDetails.find(c => c.id === country) || countryDetails[0];
  
  const {
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
  } = useSocket();

  // Set up toast function globally
  useEffect(() => {
    window.showToast = (message: string, type: 'success' | 'error' | 'warning') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    };
    
    return () => {
      delete window.showToast;
    };
  }, []);

  // Redirect if country restricted
  useEffect(() => {
    if (countryRestricted && countryRestricted !== country) {
      navigate(`/chat/${countryRestricted}/member`);
    }
  }, [countryRestricted, country, navigate]);

  useEffect(() => {
    if (country && username) {
      joinRoom(userId, username, country);
    }
  }, [country, username, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    sendMessage(userId, newMessage, country!);
    setNewMessage('');
    setIsTyping(false);
    setTyping(userId, country!, false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      setTyping(userId, country!, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(userId, country!, false);
    }, 2000);
  };

  const handleLikeMessage = (messageId: string) => {
    likeMessage(messageId, country!);
  };

  const handleReportUser = async (reportedUserId: string) => {
    if (!reportReason) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/report-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedUserId,
          reason: reportReason,
          message: reportMessage
        })
      });

      if (response.ok) {
        setToast({ message: 'User reported successfully', type: 'success' });
        setShowReportModal(false);
        setReportingUser(null);
        setReportReason('');
        setReportMessage('');
      } else {
        setToast({ message: 'Failed to report user', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getToastColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 ${getToastColor(toast.type)} text-white px-6 py-3 rounded-lg shadow-lg`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {toast.type === 'error' && <AlertTriangle className="h-4 w-4" />}
              {toast.type === 'success' && <Shield className="h-4 w-4" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{countryData.flag}</div>
            <div>
              <h2 className="font-bold text-xl text-gray-900">{countryData.name} Study Room</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{room?.activeUsers || 0} online</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-500" />
                  <span className="text-blue-600">Secured & Moderated</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Users className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${message.userId === userId ? 'justify-end' : 'justify-start'}`}
            >
              {message.userId !== userId && (
                <img
                  src={message.avatar}
                  alt={message.username}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
              )}
              
              <div className={`max-w-[70%] ${message.userId === userId ? 'order-first' : ''}`}>
                {message.userId !== userId && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{message.username}</span>
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    {message.isModerated && (
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Moderated</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div 
                  className={`rounded-2xl px-4 py-3 shadow-sm relative group ${
                    message.userId === userId
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  
                  {/* Message Actions */}
                  {message.userId !== userId && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setReportingUser(message.userId);
                          setShowReportModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Report user"
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                {message.userId !== userId && (
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLikeMessage(message.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Heart className="h-3 w-3" />
                      <span>{message.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageSquare className="h-3 w-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                )}
                
                {message.userId === userId && (
                  <div className="text-xs text-blue-200 mt-1 text-right">
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
              
              {message.userId === userId && (
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                  alt={username}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
              )}
            </motion.div>
          ))}
          
          {/* Typing Indicators */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-gray-500"
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={e => handleTyping(e.target.value)}
                placeholder="Type your message... (No contact sharing allowed)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Smile className="h-5 w-5" />
                </button>
                <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Paperclip className="h-5 w-5" />
                </button>
                <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <ImageIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!newMessage.trim()}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                !newMessage.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
              }`}
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Messages are auto-moderated. No contact sharing, inappropriate language, or spam allowed.
          </div>
        </div>
      </div>

      {/* Report User Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report User</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for reporting</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="contact_sharing">Contact Sharing</option>
                    <option value="fake_profile">Fake Profile</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional details (optional)</label>
                  <textarea
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide more details about the issue..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportingUser(null);
                    setReportReason('');
                    setReportMessage('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReportUser(reportingUser!)}
                  disabled={!reportReason}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Report User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatRoom;