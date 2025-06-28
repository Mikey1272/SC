import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, User, Loader, MessageCircle, ArrowLeft, Shield, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  
  const isFounder = type === 'founder';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, type }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        navigate('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                StudentConnect
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </button>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-gray-200"
        >
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isFounder ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              {isFounder ? (
                <BarChart3 className={`h-8 w-8 ${isFounder ? 'text-purple-600' : 'text-blue-600'}`} />
              ) : (
                <Shield className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isFounder ? 'Founder Dashboard' : 'Admin Dashboard'}
            </h2>
            <p className="text-gray-600">
              {isFounder ? 'Access founder analytics and insights' : 'Manage platform and users'}
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={`Enter ${isFounder ? 'founder' : 'admin'} username`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter password"
                />
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center ${
                isFounder 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
              }`}
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                `Access ${isFounder ? 'Founder' : 'Admin'} Dashboard`
              )}
            </motion.button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 text-center">
              <strong>Demo Credentials:</strong><br />
              {isFounder ? 'Username: founder, Password: founder123' : 'Username: admin, Password: admin123'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;