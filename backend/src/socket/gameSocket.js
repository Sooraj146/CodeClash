const { Server } = require('socket.io');

const rooms = new Map(); // roomId -> roomData
const roomTimers = new Map(); // roomId -> setInterval reference

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create_room', ({ roomId, settings, user }) => {
      rooms.set(roomId, {
        id: roomId,
        settings, // { difficulty, language, timer, negativeMarking }
        players: [{ id: socket.id, user, score: 0, hasAnsweredCurrent: false }],
        status: 'waiting',
        currentQuestionIndex: 0,
        questions: []
      });
      socket.join(roomId);
      io.to(roomId).emit('room_update', rooms.get(roomId));
    });

    socket.on('join_room', ({ roomId, user }) => {
      const room = rooms.get(roomId);
      if (room && room.status === 'waiting' && room.players.length < 4) {
        room.players.push({ id: socket.id, user, score: 0, hasAnsweredCurrent: false });
        socket.join(roomId);
        io.to(roomId).emit('room_update', room);
      } else {
        socket.emit('error', 'Room is full or does not exist');
      }
    });

    socket.on('start_game', async ({ roomId, questions }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.status = 'playing';
        room.questions = questions;
        room.currentQuestionIndex = 0;
        
        io.to(roomId).emit('game_started', { questions: room.questions });
        startQuestionTimer(io, roomId, room.settings.timer);
      }
    });

    socket.on('submit_answer', ({ roomId, isCorrect }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.hasAnsweredCurrent) return;

      player.hasAnsweredCurrent = true;

      if (isCorrect) {
        player.score += (room.settings.correctPoints || 10);
        player.isCorrectForCurrent = true;
        
        io.to(roomId).emit('player_answered', { username: player.user.username, isCorrect: true });
      } else {
        if (room.settings.wrongPoints > 0) {
          player.score -= room.settings.wrongPoints;
        }
        io.to(roomId).emit('player_answered', { username: player.user.username, isCorrect: false });
      }

      io.to(roomId).emit('room_update', room);

      // If everyone has answered, move to the next question automatically
      const allAnswered = room.players.every(p => p.hasAnsweredCurrent);
      if (allAnswered) {
        setTimeout(() => {
          nextQuestion(io, roomId);
        }, 2000);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Handle player leaving room logic here
      for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
            if (roomTimers.has(roomId)) {
              clearInterval(roomTimers.get(roomId));
              roomTimers.delete(roomId);
            }
          } else {
            io.to(roomId).emit('room_update', room);
          }
          break;
        }
      }
    });
  });

  const startQuestionTimer = (io, roomId, duration) => {
    let timeLeft = duration;
    
    const interval = setInterval(() => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') {
        clearInterval(interval);
        return;
      }

      timeLeft--;
      io.to(roomId).emit('timer_update', timeLeft);

      if (timeLeft <= 0) {
        clearInterval(interval);
        roomTimers.delete(roomId);
        nextQuestion(io, roomId);
      }
    }, 1000);
    
    roomTimers.set(roomId, interval);
  };

  const nextQuestion = (io, roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (roomTimers.has(roomId)) {
      clearInterval(roomTimers.get(roomId));
      roomTimers.delete(roomId);
    }

    room.currentQuestionIndex++;
    room.players.forEach(p => {
      p.hasAnsweredCurrent = false;
      p.isCorrectForCurrent = false;
    });

    if (room.currentQuestionIndex >= room.questions.length) {
      room.status = 'finished';
      io.to(roomId).emit('game_over', { players: room.players });
      rooms.delete(roomId);
    } else {
      io.to(roomId).emit('next_question', { questionIndex: room.currentQuestionIndex });
      startQuestionTimer(io, roomId, room.settings.timer);
    }
  };
};

module.exports = initSocket;
