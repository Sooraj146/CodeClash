import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, KeyRound, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

/* ── Forgot Password Modal ─────────────────────────────── */
function ForgotPasswordModal({ onClose }) {
  const [email, setEmail]           = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', { email, newPassword });
      setSuccess(res.data.message || 'Password updated successfully!');
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-panel p-8 w-full max-w-md relative"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-500/20 p-3 rounded-xl text-primary-400">
            <KeyRound size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Reset Password</h3>
            <p className="text-sm text-gray-400">Enter your email and choose a new password</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >✕</button>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-500/15 border border-red-500/40 text-red-300 p-3 rounded-lg mb-4 text-sm"
            >
              <XCircle size={16} className="shrink-0" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-green-500/15 border border-green-500/40 text-green-300 p-3 rounded-lg mb-4 text-sm"
            >
              <CheckCircle2 size={16} className="shrink-0" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleReset} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Mail size={17} />
              </div>
              <input
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={17} />
              </div>
              <input
                type={showPw ? 'text' : 'password'} required
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 pl-10 pr-11 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={17} />
              </div>
              <input
                type={showPw ? 'text' : 'password'} required
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-dark-900 border rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 transition-colors ${
                  confirm && confirm !== newPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : confirm && confirm === newPassword
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500'
                }`}
              />
              {confirm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {confirm === newPassword
                    ? <CheckCircle2 size={16} className="text-green-400" />
                    : <XCircle size={16} className="text-red-400" />}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Login Page ─────────────────────────────────────────── */
export default function Login() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 w-full max-w-md"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Welcome Back</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/40 text-red-300 p-3 rounded-lg mb-6 text-sm">
              <XCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email" required
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-400">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password" required
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">Sign up</Link>
          </p>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>
    </>
  );
}
