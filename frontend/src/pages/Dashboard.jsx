import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Play, Users, Settings, Database } from 'lucide-react';

export default function Dashboard() {
  const [joinCode, setJoinCode] = useState('');
  const [language, setLanguage] = useState('Random');
  const [difficulty, setDifficulty] = useState('Medium');
  const [timer, setTimer] = useState(15);
  const [correctPoints, setCorrectPoints] = useState(10);
  const [wrongPoints, setWrongPoints] = useState(5);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const settings = { language, difficulty, timer: Number(timer), correctPoints: Number(correctPoints), wrongPoints: Number(wrongPoints) };
    
    // Store settings temporarily to pass to the room
    sessionStorage.setItem('roomSettings', JSON.stringify(settings));
    navigate(`/room/${roomId}?action=create`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/room/${joinCode.toUpperCase()}?action=join`);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Welcome, {user?.username}!</h1>
        <p className="text-gray-400">Ready to test your coding skills today?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Room Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-500/20 p-3 rounded-lg text-primary-400">
              <Settings size={24} />
            </div>
            <h2 className="text-2xl font-bold">Create Arena</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="Random">Random</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-4 rounded-lg font-medium transition-all ${difficulty === diff ? 'bg-primary-600 text-white' : 'bg-dark-900 border border-dark-600 text-gray-400 hover:border-primary-500/50'}`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Timer per question (seconds)</label>
              <input 
                type="range" 
                min="10" 
                max="60" 
                step="5"
                value={timer}
                onChange={(e) => setTimer(e.target.value)}
                className="w-full accent-primary-500"
              />
              <div className="text-right text-primary-400 font-bold mt-1">{timer}s</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Points (Correct)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={correctPoints}
                  onChange={(e) => setCorrectPoints(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Points (Wrong)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={wrongPoints}
                  onChange={(e) => setWrongPoints(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <button 
              onClick={handleCreateRoom}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg flex justify-center items-center gap-2 mt-4"
            >
              <Play size={20} />
              Create & Enter Room
            </button>
          </div>
        </motion.div>

        {/* Join Room Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-8"
        >
          <div className="glass-panel p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-500/20 p-3 rounded-lg text-purple-400">
                <Users size={24} />
              </div>
              <h2 className="text-2xl font-bold">Join Squad</h2>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Room Code</label>
                <input
                  type="text"
                  required
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg py-4 px-4 text-white text-center text-2xl tracking-widest uppercase focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="ENTER CODE"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-2"
              >
                Join Room
              </button>
            </form>
          </div>
          
          <div className="glass-panel p-8 flex-1 flex flex-col justify-center items-center text-center">
             <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400 mb-4">
               <Database size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">Question Bank</h3>
             <p className="text-gray-400 mb-6">Manage questions, add bulk questions, or modify the database.</p>
             <button 
                onClick={() => navigate('/admin')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
              >
                Access Admin Panel
              </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
