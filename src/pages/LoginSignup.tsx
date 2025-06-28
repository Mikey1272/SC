import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatContext } from '../context/ChatContext';
import { 
  Lock, 
  User, 
  Loader, 
  MessageCircle, 
  ArrowLeft, 
  Key, 
  FileText, 
  Upload, 
  Mail,
  Eye,
  EyeOff,
  Smartphone,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, database } from '../config/firebase';
import { ref, set, get } from 'firebase/database';

const LoginSignup = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [visaPhoto, setVisaPhoto] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [consultancyName, setConsultancyName] = useState('');
  const [showDeviceSwitch, setShowDeviceSwitch] = useState(false);
  const [existingDevice, setExistingDevice] = useState('');
  const [step, setStep] = useState(1); // 1: auth, 2: visa verification
  
  const navigate = useNavigate();
  const { country, type } = useParams<{ country: string; type: string }>();
  const { setIsLoggedIn, setUsername: setContextUsername } = useChatContext();

  const isReferralMode = type === 'referral';

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
    setReferralCode(code);
    validateReferralCode(code);
  };

  const handleVisaPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setVisaPhoto(file);
      setError('');
    }
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const deviceId = getDeviceId();
      const endpoint = 'http://localhost:3001/api/auth/register-referral';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          referralCode,
          country,
          deviceId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setContextUsername(username);
        navigate(`/chat/${country}/member`);
      } else if (data.canSwitch) {
        setExistingDevice(data.existingDevice);
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
          referralCode,
          deviceId,
          username
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setContextUsername(username);
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      let userCredential;
      
      if (mode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      const deviceId = getDeviceId();

      // Register with backend
      const response = await fetch('http://localhost:3001/api/auth/register-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username || user.displayName || email.split('@')[0],
          email: user.email,
          password: 'firebase-auth', // Placeholder since Firebase handles auth
          deviceId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.needsVisaVerification) {
          setStep(2); // Move to visa verification step
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

      // Register with backend
      const response = await fetch('http://localhost:3001/api/auth/register-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          password: 'google-auth',
          deviceId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.needsVisaVerification) {
          setStep(2);
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

  const handleVisaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!visaPhoto) {
      setError('Please upload your visa document');
      setIsLoading(false);
      return;
    }

    try {
      // In production, upload to Firebase Storage
      const visaPhotoUrl = 'placeholder-visa-url';
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/auth/upload-visa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visaPhotoUrl,
          country
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setContextUsername(data.user.username);
        navigate(`/chat/${country}/member`);
      } else {
        setError(data.error || 'Visa upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              onClick={() => navigate(`/access/${country}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">{countryFlags[country || 'us']}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? (
                isReferralMode ? 'Enter Referral Code' : 'Join StudentConnect'
              ) : (
                'Visa Verification Required'
              )}
            </h2>
            <p className="text-gray-600">
              {step === 1 ? (
                isReferralMode 
                  ? `Access ${countryNames[country || 'us']} chat room with your consultancy code`
                  : `Create account to access ${countryNames[country || 'us']} chat room`
              ) : (
                'Upload your visa document for verification'
              )}
            </p>
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
                    <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-3" />
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

          {/* Step 1: Authentication */}
          {step === 1 && (
            <>
              {isReferralMode ? (
                <form onSubmit={handleReferralSubmit} className="space-y-6">
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
                        placeholder="Enter your username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Referral Code</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => handleReferralCodeChange(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your referral code"
                      />
                    </div>
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
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setMode('login')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        mode === 'login'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setMode('signup')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        mode === 'signup'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {mode === 'signup' && (
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
                            placeholder="Enter your username"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your email"
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
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

                    {mode === 'signup' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Confirm your password"
                          />
                        </div>
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
                        mode === 'login' ? 'Sign In' : 'Create Account'
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
                </div>
              )}
            </>
          )}

          {/* Step 2: Visa Verification */}
          {step === 2 && (
            <form onSubmit={handleVisaSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  To ensure the security of our platform, please upload a clear photo of your student visa.
                  This helps us verify that you're a legitimate international student.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Visa Document</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVisaPhotoChange}
                    className="hidden"
                    id="visa-upload"
                    required
                  />
                  <label htmlFor="visa-upload" className="cursor-pointer">
                    {visaPhoto ? (
                      <div className="text-green-600">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">{visaPhoto.name}</p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Upload visa document</p>
                        <p className="text-xs">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !visaPhoto}
                className="w-full font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  'Submit for Verification'
                )}
              </motion.button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Your visa will be reviewed within 24-48 hours. You'll receive an email once approved.
                </p>
              </div>
            </form>
          )}

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 text-center">
              {isReferralMode 
                ? 'Your referral code can only be used on one device. Contact your consultancy if you need help.'
                : 'By creating an account, you agree to our Terms of Service and Privacy Policy.'
              }
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginSignup;