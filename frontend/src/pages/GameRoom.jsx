import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Code2, Copy, Check, CheckCircle2, XCircle, Skull, Zap, Trophy, Shield } from 'lucide-react';

const MODE_STYLES = {
  competitive: { icon: Trophy, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Competitive' },
  speedrun:    { icon: Zap,    color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Speedrun' },
  survival:    { icon: Shield, color: 'text-red-400',  bg: 'bg-red-500/10',  border: 'border-red-500/30',  label: 'Survival' },
};

export default function GameRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(0);
  const [speedrunTimer, setSpeedrunTimer] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isEliminated, setIsEliminated] = useState(false);
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [gameOverStats, setGameOverStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.connect();

    const queryParams = new URLSearchParams(location.search);
    const action = queryParams.get('action');

    if (action === 'create') {
      const settingsStr = sessionStorage.getItem('roomSettings');
      if (settingsStr) {
        socket.emit('create_room', { roomId, settings: JSON.parse(settingsStr), user });
      } else {
        navigate('/dashboard');
      }
    } else if (action === 'join') {
      socket.emit('join_room', { roomId, user });
    }

    socket.on('room_update', (roomData) => { setRoom(roomData); setLoading(false); });
    socket.on('error', (msg) => { alert(msg); navigate('/dashboard'); });

    socket.on('game_started', ({ questions }) => {
      setRoom(prev => ({ ...prev, status: 'playing', questions }));
      setCurrentQuestion(questions[0]);
      setSelectedAnswer(null);
      setTextAnswer('');
      setFeedback(null);
      setIsEliminated(false);
      setEliminatedPlayers([]);
    });

    socket.on('next_question', ({ questionIndex }) => {
      setRoom(prev => {
        const newRoom = { ...prev, currentQuestionIndex: questionIndex };
        setCurrentQuestion(newRoom.questions[questionIndex]);
        return newRoom;
      });
      setSelectedAnswer(null);
      setTextAnswer('');
      setFeedback(null);
    });

    socket.on('timer_update', setTimer);
    socket.on('speedrun_timer_update', setSpeedrunTimer);

    socket.on('player_answered', ({ username, isCorrect }) => {
      if (username === user.username) setFeedback({ isCorrect });
    });

    socket.on('player_eliminated', ({ username }) => {
      setEliminatedPlayers(prev => [...prev, username]);
    });

    socket.on('you_are_eliminated', () => {
      setIsEliminated(true);
      setFeedback({ isCorrect: false, eliminated: true });
    });

    socket.on('game_over', ({ players }) => {
      setRoom(prev => ({ ...prev, status: 'finished' }));
      setGameOverStats(players.sort((a, b) => b.score - a.score));
    });

    return () => {
      ['room_update','error','game_started','next_question','timer_update','speedrun_timer_update',
       'player_answered','player_eliminated','you_are_eliminated','game_over'].forEach(e => socket.off(e));
      socket.disconnect();
    };
  }, [roomId, location, user, navigate]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (!room || room.players[0].user.username !== user.username) return;
    try {
      const { language, difficulty, questionCount } = room.settings;
      const res = await axios.get('/api/questions', { params: { language, difficulty, limit: questionCount || 5 } });
      if (res.data.length > 0) {
        socket.emit('start_game', { roomId, questions: res.data });
      } else {
        alert('No questions found for these settings.');
      }
    } catch {
      alert('Failed to fetch questions');
    }
  };

  const handleAnswerSubmit = (option) => {
    if (selectedAnswer || feedback || isEliminated) return;
    setSelectedAnswer(option);
    const isCorrect = option === currentQuestion.correctAnswer;
    socket.emit('submit_answer', { roomId, isCorrect });
  };

  const handleTextSubmit = () => {
    if (selectedAnswer || feedback || !textAnswer.trim() || isEliminated) return;
    setSelectedAnswer(textAnswer);
    const isCorrect = textAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    socket.emit('submit_answer', { roomId, isCorrect });
  };

  if (loading || !room) return <div className="flex-1 flex items-center justify-center text-gray-400">Loading arena...</div>;

  const gameMode = room.settings?.gameMode || 'competitive';
  const modeStyle = MODE_STYLES[gameMode] || MODE_STYLES.competitive;
  const ModeIcon = modeStyle.icon;

  // ── Waiting Room ──────────────────────────────────────────────────────
  if (room.status === 'waiting') {
    const isHost = room.players[0].user.username === user.username;
    return (
      <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="glass-panel p-8 w-full">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${modeStyle.bg} ${modeStyle.color} border ${modeStyle.border}`}>
              <ModeIcon size={16} /> {modeStyle.label} Mode
            </div>
            <h2 className="text-3xl font-bold mb-2">Waiting Area</h2>
            <div className="inline-flex items-center gap-3 bg-dark-900 border border-dark-600 rounded-lg p-3">
              <span className="text-gray-400">Room Code:</span>
              <span className="font-mono text-xl tracking-widest font-bold text-primary-400">{roomId}</span>
              <button onClick={copyRoomId} className="text-gray-400 hover:text-white transition">
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <div className="bg-dark-900 rounded-xl p-6 mb-6 border border-dark-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users size={20} /> Players ({room.players.length}/4)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {room.players.map((p, idx) => (
                <div key={p.id} className="bg-dark-800 p-4 rounded-lg flex items-center gap-3 border border-dark-600">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                    {p.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-bold">
                    {p.user.username} {idx === 0 && <span className="text-xs bg-primary-600 px-2 py-0.5 rounded ml-2">Host</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8 text-sm bg-dark-900/50 p-4 rounded-lg">
            <div><span className="text-gray-400">Mode:</span> <span className={`font-bold ${modeStyle.color}`}>{modeStyle.label}</span></div>
            <div><span className="text-gray-400">Language:</span> <span className="font-medium">{room.settings.language}</span></div>
            <div><span className="text-gray-400">Difficulty:</span> <span className="font-medium">{room.settings.difficulty}</span></div>
            {gameMode === 'speedrun' && <div><span className="text-gray-400">Total Time:</span> <span className="font-medium text-yellow-400">{room.settings.speedrunTime}s</span></div>}
            {gameMode !== 'speedrun' && <div><span className="text-gray-400">Questions:</span> <span className="font-medium">{room.settings.questionCount || 5}</span></div>}
            {gameMode !== 'survival' && <div><span className="text-gray-400">Timer/Q:</span> <span className="font-medium">{room.settings.timer}s</span></div>}
            {gameMode === 'competitive' && <div><span className="text-gray-400">Points:</span> <span className="font-medium">+{room.settings.correctPoints} / -{room.settings.wrongPoints}</span></div>}
          </div>

          {isHost ? (
            <button onClick={startGame} className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg">
              Start Game
            </button>
          ) : (
            <div className="text-center text-gray-400 p-4 bg-dark-900 rounded-xl border border-dark-700 animate-pulse">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────────────────
  if (room.status === 'finished') {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-8 w-full max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Match Results</h2>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-8 ${modeStyle.bg} ${modeStyle.color} border ${modeStyle.border}`}>
            <ModeIcon size={13} /> {modeStyle.label} Mode
          </div>
          <div className="space-y-4 mb-8">
            {gameOverStats?.map((p, idx) => (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${idx === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : p.eliminated ? 'bg-red-500/10 border-red-500/20 opacity-60' : 'bg-dark-900 border-dark-600'}`}>
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-black ${idx === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>#{idx + 1}</div>
                  <div className="font-bold text-lg">{p.user.username}</div>
                  {p.eliminated && <span className="text-xs text-red-400 flex items-center gap-1"><Skull size={12} /> Eliminated</span>}
                </div>
                <div className="text-2xl font-bold text-primary-400">{p.score} <span className="text-sm text-gray-400 font-normal">pts</span></div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/dashboard')} className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-lg font-bold transition-all">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Playing View ──────────────────────────────────────────────────────
  const myPlayer = room.players?.find(p => p.user?.username === user.username);
  const amEliminated = myPlayer?.eliminated || isEliminated;

  return (
    <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex flex-col gap-4">
        <div className="glass-panel p-4 flex-1 flex flex-col">
          <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-dark-600 pb-2"><Users size={18} /> Scoreboard</h3>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {room.players.map(p => (
              <div key={p.id} className={`p-3 rounded-lg flex justify-between items-center transition-colors border ${
                p.eliminated ? 'border-red-500/30 bg-red-500/5 opacity-50' : p.hasAnsweredCurrent ? 'bg-dark-900 opacity-70 border-dark-700' : 'bg-dark-800 border-dark-700'
              }`}>
                <span className="font-medium truncate flex items-center gap-2">
                  {p.eliminated && <Skull size={13} className="text-red-400" />}
                  {p.user.username}
                </span>
                <span className="font-bold text-primary-400">
                  {gameMode === 'speedrun' ? `${p.score} ✓` : p.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Top bar */}
        <div className="glass-panel p-4 flex justify-between items-center rounded-xl border border-dark-700">
          <div className="flex items-center gap-3">
            {/* Question counter */}
            <div className="bg-dark-900 px-4 py-2 rounded-lg font-bold text-gray-300 border border-dark-600">
              {gameMode === 'speedrun'
                ? <>✓ {room.players.find(p => p.user.username === user.username)?.score ?? 0} correct</>  
                : <>Q {room.currentQuestionIndex + 1}/{room.questions?.length}</>}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${modeStyle.bg} ${modeStyle.color}`}>
              <ModeIcon size={15} /> <Code2 size={15} /> {currentQuestion?.language}
            </div>
          </div>

          {/* Timer — hidden for Speedrun (global timer is in sidebar) */}
          {gameMode !== 'speedrun' && (
            <div className={`flex items-center gap-2 text-2xl font-black px-6 py-2 rounded-lg ${timer <= 5 ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-white bg-dark-900 border border-dark-600'}`}>
              <Clock size={24} className={timer <= 5 ? 'text-red-500' : 'text-primary-500'} />
              {String(Math.floor(timer / 60)).padStart(2,'0')}:{String(timer % 60).padStart(2,'0')}
            </div>
          )}

          {/* Speedrun: global countdown in top-right */}
          {gameMode === 'speedrun' && speedrunTimer !== null && (
            <div className={`flex items-center gap-2 text-2xl font-black px-6 py-2 rounded-lg ${
              speedrunTimer <= 10 ? 'text-red-500 animate-pulse bg-red-500/10 border border-red-500/30' : 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/30'
            }`}>
              <Zap size={24} />
              {String(Math.floor(speedrunTimer / 60)).padStart(2,'0')}:{String(speedrunTimer % 60).padStart(2,'0')}
            </div>
          )}
        </div>

        {/* Eliminated banner */}
        <AnimatePresence>
          {amEliminated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-6 flex flex-col items-center justify-center text-center border border-red-500/40 bg-red-500/10 flex-1"
            >
              <Skull size={56} className="text-red-500 mb-4" />
              <h3 className="text-2xl font-extrabold text-red-400 mb-2">You've been eliminated!</h3>
              <p className="text-gray-400">Sit tight — watch the remaining players battle it out.</p>
              <div className="mt-6 text-sm text-gray-500">
                {room.players.filter(p => !p.eliminated).map(p => (
                  <span key={p.id} className="inline-block bg-dark-800 border border-dark-600 rounded-full px-3 py-1 mr-2 text-white font-medium">
                    {p.user.username} — {p.score} pts
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question area */}
        {!amEliminated && (
          <div className="flex-1 glass-panel p-6 flex flex-col overflow-hidden relative">
            <h3 className="text-xl font-medium mb-4">
              {currentQuestion?.type === 'fill_in_the_blank' ? 'Fill in the blank:' : 'What is the output of the following code?'}
            </h3>

            <div className="flex-1 bg-[#1e1e1e] rounded-xl p-6 font-mono text-sm md:text-base overflow-auto border border-dark-600 mb-6 shadow-inner">
              <pre className="text-[#d4d4d4]"><code>{currentQuestion?.code}</code></pre>
            </div>

            {currentQuestion?.type === 'fill_in_the_blank' ? (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={!!selectedAnswer || !!feedback}
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl py-4 px-6 text-white text-lg font-mono focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); }}
                />
                <button
                  disabled={!!selectedAnswer || !!feedback || !textAnswer.trim()}
                  onClick={handleTextSubmit}
                  className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg"
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion?.options.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={!!selectedAnswer || !!feedback}
                    onClick={() => handleAnswerSubmit(option)}
                    className={`p-4 rounded-xl font-mono text-left transition-all border ${
                      selectedAnswer === option
                        ? 'bg-primary-600 border-primary-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                        : 'bg-dark-900 border-dark-600 hover:border-primary-500 text-gray-300'
                    } disabled:opacity-80 disabled:cursor-not-allowed`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Feedback overlay */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute top-4 right-4 p-4 rounded-xl flex items-center gap-3 shadow-2xl border ${
                    feedback.isCorrect ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'
                  }`}
                >
                  {feedback.isCorrect ? (
                    <>
                      <CheckCircle2 size={24} />
                      <div>
                        <div className="font-bold">Correct!</div>
                        {gameMode !== 'survival' && <div className="text-xs text-green-300">+{room.settings.correctPoints} pts</div>}
                      </div>
                    </>
                  ) : (
                    <>
                      {feedback.eliminated ? <Skull size={24} /> : <XCircle size={24} />}
                      <div>
                        <div className="font-bold">{feedback.eliminated ? 'Eliminated!' : 'Incorrect'}</div>
                        {gameMode === 'competitive' && room.settings.wrongPoints > 0 && (
                          <div className="text-xs text-red-300">-{room.settings.wrongPoints} pts</div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
