import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, MessageCircle, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Country {
  id: string;
  name: string;
  flag: string;
  activeUsers: number;
}

// Only 5 countries as requested
const countries: Country[] = [
  { id: 'us', name: 'United States', flag: '🇺🇸', activeUsers: 842 },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', activeUsers: 653 },
  { id: 'de', name: 'Germany', flag: '🇩🇪', activeUsers: 478 },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', activeUsers: 387 },
  { id: 'au', name: 'Australia', flag: '🇦🇺', activeUsers: 521 },
];

const CountrySelection = () => {
  const navigate = useNavigate();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const handleCountrySelect = (countryId: string) => {
    navigate(`/access/${countryId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
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
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            <span>Secure • Verified • Moderated</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Choose Your Study Destination
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with verified international students in your destination country. 
            Each room is moderated and secure for authentic student conversations.
          </p>
          
          {/* Live Stats */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {countries.reduce((sum, country) => sum + country.activeUsers, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Verified Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{countries.length}</div>
              <div className="text-sm text-gray-500">Study Destinations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-500">Verified Access</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {countries.map((country, index) => (
            <motion.div
              key={country.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCountrySelect(country.id)}
              onMouseEnter={() => setHoveredCountry(country.id)}
              onMouseLeave={() => setHoveredCountry(null)}
              className="bg-white rounded-2xl p-8 cursor-pointer border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Flag */}
                <motion.div
                  animate={{ scale: hoveredCountry === country.id ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-8xl mb-6"
                >
                  {country.flag}
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {country.name}
                </h3>
                
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{country.activeUsers.toLocaleString()} verified students</span>
                </div>

                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Active & Moderated</span>
                </div>

                {/* Join Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: hoveredCountry === country.id ? 1 : 0,
                    y: hoveredCountry === country.id ? 0 : 10
                  }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Join Secure Room →
                </motion.div>
              </div>

              {/* Security Badge */}
              <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Verified
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-white rounded-2xl p-8 border border-gray-200 shadow-lg"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Our Platform is Secure</h2>
            <p className="text-gray-600">Built specifically for international students with multiple layers of verification</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Referral-Only Access</h3>
              <p className="text-sm text-gray-600">Join only through trusted consultancy partners</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Visa Verification</h3>
              <p className="text-sm text-gray-600">All users verified with proper documentation</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto-Moderation</h3>
              <p className="text-sm text-gray-600">AI-powered content filtering and human oversight</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CountrySelection;