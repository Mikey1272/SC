import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import LandingPage from './pages/LandingPage';
import CountrySelection from './pages/CountrySelection';
import AccessType from './pages/AccessType';
import LoginSignup from './pages/LoginSignup';
import ChatRoom from './pages/ChatRoom';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <ChatProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/countries" element={<CountrySelection />} />
            <Route path="/access/:country" element={<AccessType />} />
            <Route path="/login/:country/:type" element={<LoginSignup />} />
            <Route path="/chat/:country/:mode" element={<ChatRoom />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-login/:type" element={<AdminLogin />} />
          </Routes>
        </div>
      </Router>
    </ChatProvider>
  );
}

export default App;