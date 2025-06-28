import { Link, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const Navbar = () => {
  const location = useLocation();
  const { isLoggedIn, username } = useChatContext();
  
  // Don't show navbar on landing page
  if (location.pathname === '/') return null;

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-xl font-bold text-blue-400 transition-colors hover:text-blue-300"
        >
          <MessageSquare className="h-6 w-6" />
          <span>StudentConnect</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{username}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Guest Mode</div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;