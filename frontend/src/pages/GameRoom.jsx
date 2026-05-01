import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, Clock, Code2, Copy, Check, CheckCircle2, XCircle } from 'lucide-react';

export default function GameRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { isCorrect: boolean }
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

    socket.on('room_update', (roomData) => {
      setRoom(roomData);
      setLoading(false);
    });

    socket.on('error', (msg) => {
      alert(msg);
      navigate('/dashboard');
    });

    socket.on('game_started', ({ questions }) => {
      setRoom(prev => ({ ...prev, status: 'playing', questions }));
      setCurrentQuestion(questions[0]);
      setSelectedAnswer(null);
      setTextAnswer('');
      setFeedback(null);
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

    socket.on('timer_update', (timeLeft) => {
      setTimer(timeLeft);
    });

    socket.on('player_answered', ({ username, isCorrect, fastest }) => {
      if (username === user.username) {
        setFeedback({ isCorrect, fastest });
      }
    });

    socket.on('game_over', ({ players }) => {
      setRoom(prev => ({ ...prev, status: 'finished' }));
      setGameOverStats(players.sort((a, b) => b.score - a.score));
    });

    return () => {
      socket.off('room_update');
      socket.off('error');
      socket.off('game_started');
      socket.off('next_question');
      socket.off('timer_update');
      socket.off('player_answered');
      socket.off('game_over');
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
      const { language, difficulty } = room.settings;
      const res = await axios.get('/api/questions', {
        params: { language, difficulty, limit: 5 }
      });
      
      if (res.data.length > 0) {
        socket.emit('start_game', { roomId, questions: res.data });
      } else {
        alert('No questions found for these settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch questions');
    }
  };

  const handleAnswerSubmit = (option) => {
    if (selectedAnswer || feedback) return; 
    
    setSelectedAnswer(option);
    const isCorrect = option === currentQuestion.correctAnswer;
    socket.emit('submit_answer', { roomId, isCorrect });
  };

  const handleTextSubmit = () => {
    if (selectedAnswer || feedback || !textAnswer.trim()) return;
    
    setSelectedAnswer(textAnswer);
    const isCorrect = textAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    socket.emit('submit_answer', { roomId, isCorrect });
  };

  if (loading || !room) {
    return <div className="flex-1 flex items-center justify-center">Loading arena...</div>;
  }

  // Waiting Room View
  if (room.status === 'waiting') {
    const isHost = room.players[0].user.username === user.username;
    
    return (
      <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="glass-panel p-8 w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Waiting Area</h2>
            <div className="inline-flex items-center gap-3 bg-dark-900 border border-dark-600 rounded-lg p-3">
              <span className="text-gray-400">Room Code:</span>
              <span className="font-mono text-xl tracking-widest font-bold text-primary-400">{roomId}</span>
              <button onClick={copyRoomId} className="text-gray-400 hover:text-white transition">
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <div className="bg-dark-900 rounded-xl p-6 mb-8 border border-dark-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users size={20} /> Players ({room.players.length}/4)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {room.players.map((p, idx) => (
                <div key={p.id} className="bg-dark-800 p-4 rounded-lg flex items-center gap-3 border border-dark-600">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-inner">
                    {p.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold">{p.user.username} {idx === 0 && <span className="text-xs bg-primary-600 px-2 py-0.5 rounded ml-2">Host</span>}</div>
                    <div className="text-xs text-gray-400">{p.user.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-sm bg-dark-900/50 p-4 rounded-lg">
            <div><span className="text-gray-400">Language:</span> <span className="font-medium">{room.settings.language}</span></div>
            <div><span className="text-gray-400">Difficulty:</span> <span className="font-medium">{room.settings.difficulty}</span></div>
            <div><span className="text-gray-400">Timer:</span> <span className="font-medium">{room.settings.timer}s</span></div>
            <div><span className="text-gray-400">Points:</span> <span className="font-medium">+{room.settings.correctPoints} / -{room.settings.wrongPoints}</span></div>
          </div>

          {isHost ? (
             <button 
               onClick={startGame}
               disabled={room.players.length < 1}
               className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-lg disabled:opacity-50"
             >
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

  // Game Over View
  if (room.status === 'finished') {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel p-8 w-full max-w-2xl text-center"
        >
          <h2 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Match Results
          </h2>
          
          <div className="space-y-4 mb-8">
            {gameOverStats?.map((p, idx) => (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl ${idx === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-dark-900 border-dark-600'} border`}>
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-black ${idx === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>#{idx + 1}</div>
                  <div className="font-bold text-lg">{p.user.username}</div>
                </div>
                <div className="text-2xl font-bold text-primary-400">{p.score} <span className="text-sm text-gray-400 font-normal">pts</span></div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-lg font-bold transition-all"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // Playing View
  return (
    <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 h-[calc(100vh-80px)]">
      {/* Left sidebar - Scoreboard */}
      <div className="w-full md:w-64 flex flex-col gap-4">
        <div className="glass-panel p-4 flex-1 flex flex-col">
          <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-dark-600 pb-2"><Users size={18} /> Scoreboard</h3>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {room.players.map(p => (
              <div key={p.id} className={`p-3 rounded-lg flex justify-between items-center transition-colors ${p.hasAnsweredCurrent ? 'bg-dark-900 opacity-70' : 'bg-dark-800'} border border-dark-700`}>
                <span className="font-medium truncate">{p.user.username}</span>
                <span className="font-bold text-primary-400">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Top Info Bar */}
        <div className="glass-panel p-4 flex justify-between items-center rounded-xl shadow-lg border border-dark-700">
           <div className="flex items-center gap-4">
             <div className="bg-dark-900 px-4 py-2 rounded-lg font-bold text-gray-300 border border-dark-600">
               Question {room.currentQuestionIndex + 1}/{room.questions?.length}
             </div>
             <div className="flex items-center gap-2 text-primary-400 bg-primary-500/10 px-4 py-2 rounded-lg font-mono">
               <Code2 size={18} /> {currentQuestion?.language}
             </div>
           </div>
           
           <div className={`flex items-center gap-2 text-2xl font-black px-6 py-2 rounded-lg ${timer <= 5 ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-white bg-dark-900 border border-dark-600'}`}>
             <Clock size={24} className={timer <= 5 ? 'text-red-500' : 'text-primary-500'} />
             00:{timer < 10 ? `0${timer}` : timer}
           </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 glass-panel p-6 flex flex-col overflow-hidden relative">
          <h3 className="text-xl font-medium mb-4">What is the output of the following code?</h3>
          
          <div className="flex-1 bg-[#1e1e1e] rounded-xl p-6 font-mono text-sm md:text-base overflow-auto border border-dark-600 mb-6 shadow-inner">
            <pre className="text-[#d4d4d4]">
              <code>{currentQuestion?.code}</code>
            </pre>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTextSubmit();
                }}
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

          {/* Feedback Overlay */}
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute top-4 right-4 p-4 rounded-xl flex items-center gap-3 shadow-2xl border ${feedback.isCorrect ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}
            >
              {feedback.isCorrect ? (
                <>
                  <CheckCircle2 size={24} />
                  <div>
                    <div className="font-bold">Correct!</div>
                    <div className="text-xs text-green-300">+{room.settings.correctPoints} pts</div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={24} />
                  <div>
                    <div className="font-bold">Incorrect</div>
                    {room.settings.wrongPoints > 0 && <div className="text-xs text-red-300">-{room.settings.wrongPoints} pts penalty</div>}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
