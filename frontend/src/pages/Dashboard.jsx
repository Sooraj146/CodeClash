import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Users, Settings, Zap, Shield, Trophy, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODES = [
  {
    id: 'competitive',
    label: 'Competitive',
    icon: Trophy,
    color: 'from-blue-600 to-primary-600',
    border: 'border-blue-500',
    glow: 'shadow-blue-500/20',
    desc: 'Score-based multiplayer. Points for correct & wrong answers.',
  },
  {
    id: 'speedrun',
    label: 'Speedrun',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    border: 'border-yellow-500',
    glow: 'shadow-yellow-500/20',
    desc: 'Answer as many questions as possible before time runs out.',
  },
  {
    id: 'survival',
    label: 'Survival',
    icon: Shield,
    color: 'from-red-600 to-rose-500',
    border: 'border-red-500',
    glow: 'shadow-red-500/20',
    desc: 'One wrong answer and you are eliminated. Last one standing wins.',
  },
];

export default function Dashboard() {
  const [gameMode, setGameMode] = useState('competitive');
  const [joinCode, setJoinCode] = useState('');
  const [language, setLanguage] = useState('Random');
  const [difficulty, setDifficulty] = useState('Medium');
  const [compTimer, setCompTimer] = useState(15);   // Competitive per-question timer
  const [survTimer, setSurvTimer] = useState(30);   // Survival per-question timer
  const [questionCount, setQuestionCount] = useState(5);
  const [speedrunTime, setSpeedrunTime] = useState(60);
  const [correctPoints, setCorrectPoints] = useState(10);
  const [wrongPoints, setWrongPoints] = useState(5);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const settings = {
      gameMode,
      language,
      difficulty,
      // Only competitive and survival use a per-question timer
      timer: gameMode === 'competitive' ? Number(compTimer) : gameMode === 'survival' ? Number(survTimer) : 0,
      questionCount: Number(questionCount),
      speedrunTime: Number(speedrunTime),
      correctPoints: Number(correctPoints),
      wrongPoints: Number(wrongPoints),
    };
    sessionStorage.setItem('roomSettings', JSON.stringify(settings));
    navigate(`/room/${roomId}?action=create`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/room/${joinCode.toUpperCase()}?action=join`);
    }
  };

  const activeMode = MODES.find(m => m.id === gameMode);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Welcome, {user?.username}!</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-dark-800 hover:bg-red-600/20 border border-dark-600 hover:border-red-500/50 text-gray-400 hover:text-red-400 px-4 py-2 rounded-xl transition-all font-medium text-sm"
        >
          <LogOut size={16} /> Logout
        </button>
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
            {/* Game Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Game Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = gameMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setGameMode(mode.id)}
                      className={`relative flex flex-col items-center gap-2 py-3 px-2 rounded-xl font-medium transition-all border text-sm ${
                        isActive
                          ? `bg-gradient-to-br ${mode.color} text-white ${mode.border} shadow-lg ${mode.glow}`
                          : 'bg-dark-900 border-dark-600 text-gray-400 hover:border-dark-500 hover:text-gray-200'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="leading-tight text-center">{mode.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="mode-indicator"
                          className="absolute inset-0 rounded-xl ring-2 ring-white/20"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={gameMode}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-xs text-gray-500 mt-2 pl-1"
                >
                  {activeMode.desc}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="Random">Random</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="Web">Web (HTML/CSS/JS)</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-4 rounded-lg font-medium transition-all ${
                      difficulty === diff
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-900 border border-dark-600 text-gray-400 hover:border-primary-500/50'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode-specific settings with animation */}
            <AnimatePresence mode="wait">
              {gameMode === 'competitive' && (
                <motion.div
                  key="competitive-settings"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Timer</label>
                      <input type="range" min="10" max="60" step="5" value={compTimer}
                        onChange={(e) => setCompTimer(e.target.value)} className="w-full accent-primary-500" />
                      <div className="text-right text-primary-400 font-bold mt-1">{compTimer}s</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Number of Questions</label>
                      <input type="range" min="2" max="10" step="1" value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)} className="w-full accent-purple-500" />
                      <div className="text-right text-purple-400 font-bold mt-1">{questionCount} Qs</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Points (Correct)</label>
                      <input type="number" min="1" max="100" value={correctPoints}
                        onChange={(e) => setCorrectPoints(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Points (Wrong)</label>
                      <input type="number" min="0" max="100" value={wrongPoints}
                        onChange={(e) => setWrongPoints(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-red-500 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              )}

              {gameMode === 'speedrun' && (
                <motion.div
                  key="speedrun-settings"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Total Time Limit</label>
                    <input type="range" min="30" max="180" step="15" value={speedrunTime}
                      onChange={(e) => setSpeedrunTime(e.target.value)} className="w-full accent-yellow-500" />
                    <div className="text-right text-yellow-400 font-bold mt-1">{speedrunTime}s</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-xs">
                    ⚡ Infinite questions cycle until time runs out. Score = total correct in {speedrunTime}s.
                  </div>
                </motion.div>
              )}

              {gameMode === 'survival' && (
                <motion.div
                  key="survival-settings"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Timer</label>
                    <input type="range" min="10" max="180" step="10" value={survTimer}
                      onChange={(e) => setSurvTimer(e.target.value)} className="w-full accent-red-500" />
                    <div className="text-right text-red-400 font-bold mt-1">{survTimer}s</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs">
                    💀 One wrong answer eliminates you. Timer expiry also counts as wrong!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleCreateRoom}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg flex justify-center items-center gap-2 mt-4"
            >
              <Play size={20} />
              Create &amp; Enter Room
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

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="glass-panel p-8 flex-1 flex flex-col justify-between overflow-hidden relative"
          >
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-center mb-6">
              <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="10" width="120" height="80" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                <rect x="28" y="18" width="104" height="64" rx="4" fill="#0f172a" />
                <rect x="28" y="18" width="104" height="64" rx="4" fill="url(#screenGlow)" opacity="0.3" />
                <rect x="36" y="28" width="50" height="4" rx="2" fill="#3b82f6" opacity="0.9" />
                <rect x="36" y="36" width="70" height="4" rx="2" fill="#7c3aed" opacity="0.7" />
                <rect x="44" y="44" width="40" height="4" rx="2" fill="#3b82f6" opacity="0.8" />
                <rect x="44" y="52" width="60" height="4" rx="2" fill="#10b981" opacity="0.7" />
                <rect x="36" y="60" width="55" height="4" rx="2" fill="#7c3aed" opacity="0.6" />
                <rect x="36" y="68" width="35" height="4" rx="2" fill="#f59e0b" opacity="0.8" />
                <rect x="72" y="68" width="3" height="8" rx="1" fill="#f8fafc" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;0;0.9" dur="1.1s" repeatCount="indefinite" />
                </rect>
                <rect x="68" y="90" width="24" height="6" rx="2" fill="#334155" />
                <rect x="55" y="96" width="50" height="5" rx="2" fill="#334155" />
                <circle cx="140" cy="25" r="3" fill="#3b82f6" opacity="0.6">
                  <animate attributeName="cy" values="25;18;25" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="148" cy="50" r="2" fill="#7c3aed" opacity="0.5">
                  <animate attributeName="cy" values="50;42;50" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="15" cy="55" r="2.5" fill="#10b981" opacity="0.5">
                  <animate attributeName="cy" values="55;48;55" dur="2s" repeatCount="indefinite" />
                </circle>
                <defs>
                  <linearGradient id="screenGlow" x1="28" y1="18" x2="132" y2="82" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </div>


            <div>
              <p className="text-lg font-semibold text-white leading-relaxed mb-3 text-center">
                "Any fool can write code that a computer can understand. Good programmers write code that <span className="text-blue-400">humans</span> can understand."
              </p>
              <p className="text-sm text-gray-500 text-center font-medium tracking-wide">— Martin Fowler</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
