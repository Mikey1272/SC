import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatContext } from '../context/ChatContext';
import { Check, CreditCard, Loader, MessageCircle, ArrowLeft, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const SubscriptionPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const navigate = useNavigate();
  const { country, mode } = useParams<{ country: string; mode: string }>();
  const { setIsSubscribed } = useChatContext();

  const handleSubscribe = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsSubscribed(true);
      navigate(`/chat/${country}/${mode}`);
    }, 2000);
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 55,
      originalPrice: 99,
      period: 'month',
      savings: '44% OFF',
      popular: true
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: 499,
      originalPrice: 1188,
      period: 'year',
      savings: '58% OFF',
      popular: false
    }
  ];

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
              onClick={() => navigate(`/chat/${country}/${mode}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Chat
            </button>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl border border-gray-200"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              Upgrade to Premium
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Join the Conversation</h2>
            <p className="text-gray-600">Get full access to all chat rooms and premium features</p>
          </div>
          
          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-sm text-gray-500 line-through">₹{plan.originalPrice}</span>
                    <div className="text-2xl font-bold text-gray-900">₹{plan.price}</div>
                    <span className="text-sm text-gray-600">/{plan.period}</span>
                  </div>
                  <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    {plan.savings}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Features */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Premium Features</h3>
            <ul className="space-y-3">
              {[
                'Send unlimited messages in all country chat rooms',
                'Create and join private study groups',
                'Share files, images, and resources',
                'Priority customer support',
                'Ad-free experience',
                'Advanced search and filters',
                'Message history and backup'
              ].map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          
          {/* Payment Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CVC</label>
                <input
                  type="text"
                  placeholder="123"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-4 px-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>Subscribe Now - ₹{plans.find(p => p.id === selectedPlan)?.price}/{plans.find(p => p.id === selectedPlan)?.period}</span>
              </>
            )}
          </motion.button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">
              🔒 Secure payment powered by Stripe
            </p>
            <p className="text-xs text-gray-400">
              Cancel anytime. No hidden fees. 30-day money-back guarantee.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionPage;