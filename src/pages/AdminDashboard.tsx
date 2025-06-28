import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Globe, 
  TrendingUp, 
  Activity, 
  Shield, 
  Settings, 
  BarChart3,
  UserCheck,
  AlertTriangle,
  Clock,
  Filter,
  Plus,
  Download,
  Copy,
  CheckCircle,
  Eye,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  totalMessages: number;
  totalConsultancies: number;
  totalReferralCodes: number;
  usedReferralCodes: number;
  expiredReferralCodes: number;
  pendingReports: number;
  countryStats: Array<{
    country: string;
    flag: string;
    activeUsers: number;
    totalMessages: number;
    totalUsers: number;
    onlineUsers: number;
  }>;
}

interface Consultancy {
  id: string;
  name: string;
  totalCodes: number;
  usedCodes: number;
  unusedCodes: number;
  expiredCodes: number;
  activeCodes: number;
  createdAt: string;
  isActive: boolean;
}

interface ConsultancyDetails {
  id: string;
  name: string;
  totalCodes: number;
  usedCodes: number;
  referralCodes: Array<{
    code: string;
    isUsed: boolean;
    usedBy?: string;
    usedAt?: string;
    expiresAt: string;
    assignedCountry?: string;
    isExpired: boolean;
  }>;
}

const countries = [
  { id: 'us', name: 'United States', flag: '🇺🇸' },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'de', name: 'Germany', flag: '🇩🇪' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦' },
  { id: 'au', name: 'Australia', flag: '🇦🇺' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [consultancies, setConsultancies] = useState<Consultancy[]>([]);
  const [selectedConsultancy, setSelectedConsultancy] = useState<ConsultancyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showConsultancyModal, setShowConsultancyModal] = useState(false);
  const [consultancyName, setConsultancyName] = useState('');
  const [numberOfCodes, setNumberOfCodes] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchConsultancies();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchConsultancies();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConsultancies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/consultancies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConsultancies(data);
      }
    } catch (error) {
      console.error('Failed to fetch consultancies:', error);
    }
  };

  const fetchConsultancyDetails = async (consultancyId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/admin/consultancy/${consultancyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedConsultancy(data);
        setShowConsultancyModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch consultancy details:', error);
    }
  };

  const handleGenerateReferrals = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/admin/generate-referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          consultancyName,
          numberOfCodes: parseInt(numberOfCodes)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedCodes(data.codes);
        setConsultancyName('');
        setNumberOfCodes('');
        fetchConsultancies();
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to generate referral codes');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadCodes = () => {
    const codesText = generatedCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${consultancyName}-referral-codes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (isUsed: boolean, isExpired: boolean) => {
    if (isExpired) return 'bg-red-100 text-red-800';
    if (isUsed) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (isUsed: boolean, isExpired: boolean) => {
    if (isExpired) return 'Expired';
    if (isUsed) return 'Used';
    return 'Active';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">StudentConnect Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate Referral Codes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: 'Total Users', 
              value: stats?.totalUsers?.toLocaleString() || '0', 
              icon: <Users className="h-6 w-6" />, 
              color: 'blue',
              change: '+12%'
            },
            { 
              title: 'Online Now', 
              value: stats?.onlineUsers?.toLocaleString() || '0', 
              icon: <Activity className="h-6 w-6" />, 
              color: 'green',
              change: '+5%'
            },
            { 
              title: 'Total Messages', 
              value: stats?.totalMessages?.toLocaleString() || '0', 
              icon: <MessageSquare className="h-6 w-6" />, 
              color: 'purple',
              change: '+28%'
            },
            { 
              title: 'Consultancies', 
              value: stats?.totalConsultancies?.toString() || '0', 
              icon: <Globe className="h-6 w-6" />, 
              color: 'indigo',
              change: '+3%'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                  {stat.icon}
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Referral Codes Stats */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Code Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalReferralCodes || 0}</div>
                <div className="text-sm text-gray-600">Total Codes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.usedReferralCodes || 0}</div>
                <div className="text-sm text-gray-600">Used Codes</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {(stats?.totalReferralCodes || 0) - (stats?.usedReferralCodes || 0) - (stats?.expiredReferralCodes || 0)}
                </div>
                <div className="text-sm text-gray-600">Active Codes</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats?.expiredReferralCodes || 0}</div>
                <div className="text-sm text-gray-600">Expired Codes</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Country Statistics</h3>
            <div className="space-y-4">
              {stats?.countryStats?.map((country, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <span className="font-medium text-gray-900">{country.country}</span>
                      <div className="text-sm text-gray-600">
                        {country.onlineUsers} online • {country.totalUsers} total users
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{country.activeUsers}</div>
                    <div className="text-sm text-gray-600">{country.totalMessages} messages</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Consultancies Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Consultancies Management</h2>
            <p className="text-sm text-gray-600 mt-1">Click on a consultancy to view detailed referral codes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultancy Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Codes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used / Active / Expired
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultancies.map((consultancy) => (
                  <motion.tr 
                    key={consultancy.id} 
                    className="hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.01 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{consultancy.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultancy.totalCodes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {consultancy.usedCodes} used
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {consultancy.activeCodes} active
                        </span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          {consultancy.expiredCodes} expired
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(consultancy.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        consultancy.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {consultancy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => fetchConsultancyDetails(consultancy.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Referral Codes Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Referral Codes</h3>
              
              {generatedCodes.length > 0 ? (
                <div>
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">
                      ✓ Successfully generated {generatedCodes.length} referral codes!
                      <br />
                      <span className="text-xs">Codes expire in 1 year from creation date</span>
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Generated Codes</h4>
                      <button
                        onClick={downloadCodes}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {generatedCodes.map((code, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm font-mono">{code}</span>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {copiedCode === code ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setGeneratedCodes([]);
                        setShowGenerateModal(false);
                      }}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerateReferrals}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consultancy Name
                    </label>
                    <input
                      type="text"
                      value={consultancyName}
                      onChange={(e) => setConsultancyName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter consultancy name"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Referral Codes
                    </label>
                    <input
                      type="number"
                      value={numberOfCodes}
                      onChange={(e) => setNumberOfCodes(e.target.value)}
                      required
                      min="1"
                      max="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter number of codes"
                    />
                    <p className="text-xs text-gray-500 mt-1">All codes will expire in 1 year</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowGenerateModal(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Consultancy Details Modal */}
      <AnimatePresence>
        {showConsultancyModal && selectedConsultancy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedConsultancy.name}</h3>
                  <p className="text-sm text-gray-600">Referral Codes Management</p>
                </div>
                <button
                  onClick={() => setShowConsultancyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedConsultancy.totalCodes}</div>
                  <div className="text-sm text-gray-600">Total Codes</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedConsultancy.usedCodes}</div>
                  <div className="text-sm text-gray-600">Used Codes</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedConsultancy.referralCodes.filter(c => !c.isUsed && !c.isExpired).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Codes</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedConsultancy.referralCodes.filter(c => c.isExpired).length}
                  </div>
                  <div className="text-sm text-gray-600">Expired Codes</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedConsultancy.referralCodes.map((code, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{code.code}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(code.isUsed, code.isExpired)
                          }`}>
                            {getStatusText(code.isUsed, code.isExpired)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {code.assignedCountry ? (
                            <span className="flex items-center gap-1">
                              {countries.find(c => c.id === code.assignedCountry)?.flag}
                              {countries.find(c => c.id === code.assignedCountry)?.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {code.usedAt ? formatDate(code.usedAt) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(code.expiresAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {copiedCode === code.code ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;