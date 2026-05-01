import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-dark-800 border-b border-dark-700 py-4 px-6 flex justify-between items-center shadow-lg">
      <Link to="/" className="flex items-center gap-2 text-primary-500 font-bold text-xl hover:text-primary-400 transition-colors">
        <Code2 size={28} />
        <span>CodeClash</span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2 text-gray-300 bg-dark-900 px-4 py-2 rounded-full border border-dark-700">
              <User size={18} />
              <span className="font-medium">{user.username}</span>
              <span className="text-accent ml-2 text-sm font-bold">{user.xp} XP</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors p-2"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium">Login</Link>
            <Link to="/signup" className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/30">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
