import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Code, Zap, Users, Trophy } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 max-w-3xl"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
          Master Code Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent">Battle</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
          The ultimate real-time multiplayer coding game. Guess the output, beat the clock, and climb the leaderboard in solo or squad mode.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {user ? (
            <Link to="/dashboard" className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              Enter Arena
            </Link>
          ) : (
            <Link to="/signup" className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              Start Playing Free
            </Link>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, mt: 50 }}
        animate={{ opacity: 1, mt: 80 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10"
      >
        <div className="glass-panel p-6 flex flex-col items-center text-center">
          <div className="bg-primary-500/20 p-4 rounded-full text-primary-400 mb-4">
            <Zap size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Real-Time Action</h3>
          <p className="text-gray-400 text-sm">Race against the clock and other players to find the correct output first.</p>
        </div>
        <div className="glass-panel p-6 flex flex-col items-center text-center">
          <div className="bg-purple-500/20 p-4 rounded-full text-purple-400 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Squad Mode</h3>
          <p className="text-gray-400 text-sm">Team up with up to 3 friends and compete together in private rooms.</p>
        </div>
        <div className="glass-panel p-6 flex flex-col items-center text-center">
          <div className="bg-accent/20 p-4 rounded-full text-accent mb-4">
            <Trophy size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Climb Ranks</h3>
          <p className="text-gray-400 text-sm">Earn XP, level up your profile, and become the ultimate code master.</p>
        </div>
      </motion.div>
    </div>
  );
}
