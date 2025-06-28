import { useNavigate, useParams } from 'react-router-dom';
import { UserRound, FileText, MessageCircle, Shield, Key, Mail, Eye, EyeOff, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useChatContext } from '../context/ChatContext';

const AccessType = () => {
  const navigate = useNavigate();
  const { country } = useParams<{ country: string }>();
  const { setIsLoggedIn, setUsername: setContextUsername } = useChatContext();
  
  const [accessType, setAccessType] = useState<'referral' | 'email' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [consultancyName, setConsultancyName] = useState('');
  const [showDeviceSwitch, setShowDeviceSwitch] = useState(false);

  const countryNames: Record<string, string> = {
    us: 'United States',
    uk: 'United Kingdom',
    de: 'Germany',
    ca: 'Canada',
    au: 'Australia'
  };

  const countryFlags: Record<string, string> = {
    us: '🇺🇸',
    uk: '🇬🇧',
    de: '🇩🇪',
    ca: '🇨🇦',
    au: '🇦🇺'
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const validateReferralCode = async (code: string) => {
    if (code.length < 8) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/validate-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: code }),
      });

      const data = await response.json();
      if (response.ok) {
        setConsultancyName(data.consultancyName);
        setError('');
      } else {
        setError(data.error);
        setConsultancyName('');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleReferralCodeChange = (code: string) => {
    setFormData(prev => ({ ...prev, referralCode: code }));
    validateReferralCode(code);
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const deviceId = getDeviceId();
      const response = await fetch('http://localhost:3001/api/auth/register-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          referralCode: formData.referralCode,
          country,
          deviceId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setContextUsername(formData.username);
        navigate(`/chat/${country}/member`);
      } else if (data.canSwitch) {
        setShowDeviceSwitch(true);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (authMode === 'signup' && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      let userCredential;
      
      if (authMode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      }

      const user = userCredential.user;
      const deviceId = getDeviceId();

      // For login, try login endpoint first
      if (authMode === 'login') {
        const loginResponse = await fetch('http://localhost:3001/api/auth/login-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            deviceId,
            firebaseUid: user.uid
          }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          localStorage.setItem('authToken', loginData.token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          
          if (loginData.needsVisaVerification) {
            navigate(`/login/${country}/visa`);
          } else {
            setIsLoggedIn(true);
            setContextUsername(loginData.user.username);
            navigate(`/chat/${country}/member`);
          }
          return;
        }
      }

      // For signup or if login fails, register new user
      const response = await fetch('http://localhost:3001/api/auth/register-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username || user.displayName || formData.email.split('@')[0],
          email: user.email,
          password: 'firebase-auth',
          deviceId,
          firebaseUid: user.uid
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.needsVisaVerification) {
          navigate(`/login/${country}/visa`);
        } else {
          setIsLoggedIn(true);
          setContextUsername(data.user.username);
          navigate(`/chat/${country}/member`);
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const deviceId = getDeviceId();

      // Try login first
      const loginResponse = await fetch('http://localhost:3001/api/auth/login-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          deviceId,
          firebaseUid: user.uid
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem('authToken', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        
        if (loginData.needsVisaVerification) {
          navigate(`/login/${country}/visa`);
        } else {
          setIsLoggedIn(true);
          setContextUsername(loginData.user.username);
          navigate(`/chat/${country}/member`);
        }
        return;
      }

      // If login fails, register new user
      const response = await fetch('http://localhost:3001/api/auth/register-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          password: 'google-auth',
          deviceId,
          firebaseUid: user.uid
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.needsVisaVerification) {
          navigate(`/login/${country}/visa`);
        } else {
          setIsLoggedIn(true);
          setContextUsername(data.user.username);
          navigate(`/chat/${country}/member`);
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceSwitch = async () => {
    setIsLoading(true);
    
    try {
      const deviceId = getDeviceId();
      const response = await fetch('http://localhost:3001/api/auth/switch-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode: formData.referralCode,
          deviceId,
          username: formData.username
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setContextUsername(formData.username);
        navigate(`/chat/${country}/member`);
      } else {
        setError(data.error || 'Device switch failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setShowDeviceSwitch(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
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
          </div>
        </div>
      </nav>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl border border-gray-200 mt-16"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{countryFlags[country || 'us']}</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join {countryNames[country || 'us']} Room
          </h2>
          <p className="text-gray-600">Choose your verification method to access secure chat</p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Display */}
        <AnimatePresence>
          {consultancyName && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-green-700 text-sm">
                  ✓ Valid referral code from <strong>{consultancyName}</strong>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!accessType ? (
          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAccessType('referral')}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Key className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-lg">Referral Code</span>
                  <p className="text-sm text-blue-100">From your consultancy partner</p>
                </div>
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Recommended</span>
            </motion.button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">or</span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAccessType('email')}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-lg">Email & Visa</span>
                  <p className="text-sm text-green-100">Create account with visa verification</p>
                </div>
              </div>
              <span className="text-xs text-green-100 bg-white/20 px-2 py-1 rounded-full">Secure</span>
            </motion.button>
          </div>
        ) : accessType === 'referral' ? (
          <form onSubmit={handleReferralSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Referral Code</label>
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => handleReferralCodeChange(e.target.value)}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your referral code"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !consultancyName}
              className="w-full font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                'Join with Referral Code'
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => setAccessType(null)}
              className="w-full text-gray-600 hover:text-blue-600 transition-colors"
            >
              ← Back to options
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  authMode === 'signup'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your username"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </motion.button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>

            <button
              type="button"
              onClick={() => setAccessType(null)}
              className="w-full text-gray-600 hover:text-blue-600 transition-colors"
            >
              ← Back to options
            </button>
          </div>
        )}

        {/* Device Switch Modal */}
        <AnimatePresence>
          {showDeviceSwitch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Device Switch Required</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    This referral code is active on another device. Would you like to switch to this device?
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeviceSwitch(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeviceSwitch}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Switching...' : 'Switch Device'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Referral Code Access</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Get your unique code from your education consultancy. One code works on one device only.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Email & Visa Verification</p>
                  <p className="text-xs text-green-700 mt-1">
                    Create account with email/Google and upload visa for verification. This may take 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessType;