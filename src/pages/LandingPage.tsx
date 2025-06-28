import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Globe2, Shield, TrendingUp, Heart, MessageSquare, Send, Settings, BarChart3, ArrowRight, Sparkles, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState({
    totalUsers: 2847,
    totalMessages: 15623,
    onlineUsers: 342,
    consultancies: 28
  });

  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    // Simulate live stats updates
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 3),
        totalMessages: prev.totalMessages + Math.floor(Math.random() * 8),
        onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 5) - 2,
        consultancies: prev.consultancies
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    navigate('/countries');
  };

  const handleAdminLogin = (type: 'admin' | 'founder') => {
    navigate(`/admin-login/${type}`);
    setShowAdminDropdown(false);
  };

  const mockMessages = [
    { id: 1, user: 'Sarah M.', country: '🇺🇸', message: 'Anyone up for a study session tonight?', time: '2m ago', likes: 12, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 2, user: 'Alex K.', country: '🇬🇧', message: 'Just got my visa approved! Thanks for all the support 🎉', time: '5m ago', likes: 24, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 3, user: 'Priya S.', country: '🇩🇪', message: 'Looking for roommates in Berlin for next semester', time: '8m ago', likes: 7, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
    { id: 4, user: 'Lucas B.', country: '🇨🇦', message: 'Coffee meetup at University of Toronto tomorrow?', time: '12m ago', likes: 15, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      country: "🇺🇸 USA",
      text: "StudentConnect helped me find my study group and made my transition to the US so much smoother!",
      rating: 5
    },
    {
      name: "Ahmed Hassan",
      country: "🇬🇧 UK",
      text: "The security features give me peace of mind. I can connect with verified students without worrying about spam.",
      rating: 5
    },
    {
      name: "Maria Rodriguez",
      country: "🇨🇦 Canada",
      text: "Found my roommate through StudentConnect! The platform is amazing for international students.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Verified Students Only",
      description: "Connect with genuine international students through our rigorous verification process",
      color: "blue"
    },
    {
      icon: <Globe2 className="h-8 w-8" />,
      title: "Global Community",
      description: "Join country-specific chat rooms and connect with students in your destination",
      color: "green"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Real-time Chat",
      description: "Instant messaging with auto-moderation to ensure safe and productive conversations",
      color: "purple"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Study Groups",
      description: "Form study groups, find roommates, and build lasting friendships",
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                StudentConnect
              </span>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{liveStats.onlineUsers} online now</span>
              </motion.div>
              
              {/* Admin Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </motion.button>
                
                <AnimatePresence>
                  {showAdminDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                    >
                      <button
                        onClick={() => handleAdminLogin('founder')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Founder Dashboard
                      </button>
                      <button
                        onClick={() => handleAdminLogin('admin')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        Admin Dashboard
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                Join Now
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
              >
                <Sparkles className="h-4 w-4" />
                <span>Trusted by {liveStats.consultancies}+ Consultancies Worldwide</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              >
                Connect Globally.
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
                  Study Securely.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-600 mb-8 leading-relaxed"
              >
                Join the world's most secure student community. Connect with verified international students 
                through trusted consultancy partnerships across {' '}
                <span className="font-semibold text-blue-600">5 major study destinations</span>.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mb-8"
              >
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Start Connecting
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-colors duration-300"
                >
                  Watch Demo
                </motion.button>
              </motion.div>

              {/* Live Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {[
                  { label: "Verified Students", value: liveStats.totalUsers.toLocaleString() },
                  { label: "Partner Consultancies", value: `${liveStats.consultancies}+` },
                  { label: "Countries", value: "5" },
                  { label: "Moderated 24/7", value: "100%" }
                ].map((stat, index) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Column - Interactive Chat Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                      >
                        <Globe2 className="h-5 w-5" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold">🇺🇸 USA Study Room</h3>
                        <p className="text-sm text-blue-100">{liveStats.onlineUsers} verified students online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-green-400 rounded-full"
                      />
                      <span className="text-xs">Live & Secure</span>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 h-80 overflow-y-auto">
                  <AnimatePresence>
                    {mockMessages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex gap-3 group"
                      >
                        <motion.img
                          whileHover={{ scale: 1.1 }}
                          src={msg.avatar}
                          alt={msg.user}
                          className="w-8 h-8 rounded-full border-2 border-blue-100"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm">{msg.user}</span>
                            <span className="text-lg">{msg.country}</span>
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                              className="w-2 h-2 bg-green-500 rounded-full"
                            />
                            <span className="text-xs text-gray-500">{msg.time}</span>
                          </div>
                          <motion.div 
                            whileHover={{ backgroundColor: "#f8fafc" }}
                            className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 border border-gray-100 transition-colors"
                          >
                            {msg.message}
                          </motion.div>
                          <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <Heart className="h-3 w-3" />
                              <span>{msg.likes}</span>
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Reply</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-500 border border-gray-200">
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Secure messaging with verified students...
                      </motion.span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Floating Security Badges */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                Verified Only
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="absolute -bottom-4 -left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
              >
                Auto-Moderated
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why StudentConnect is Different</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Built for security, designed for students, trusted by consultancies worldwide</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`text-center p-6 bg-${feature.color}-50 rounded-xl border border-${feature.color}-100 hover:shadow-lg transition-all duration-300`}
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-16 h-16 bg-${feature.color}-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white`}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white mb-12"
          >
            Loved by Students Worldwide
          </motion.h2>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white"
            >
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </div>
              <p className="text-xl mb-6 italic">"{testimonials[currentTestimonial].text}"</p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{testimonials[currentTestimonial].name}</p>
                  <p className="text-blue-200">{testimonials[currentTestimonial].country}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentTestimonial ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Connect Securely?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of verified international students in secure, moderated chat rooms
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              Get Your Access Code
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">StudentConnect</span>
              </div>
              <p className="text-gray-400 text-sm">
                Secure platform connecting verified international students worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Join Chat Rooms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Find Study Partners</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Consultancies</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Partner Program</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Referral Codes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Sales</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 StudentConnect. All rights reserved. Trusted by consultancies worldwide.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;