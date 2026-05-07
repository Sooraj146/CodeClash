const { Server } = require('socket.io');

const rooms = new Map();      // roomId -> roomData
const roomTimers = new Map();  // roomId -> per-question setInterval
const speedrunTimers = new Map(); // roomId -> global speedrun setInterval

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ─────────────────────────── CREATE ROOM ──────────────────────────────
    socket.on('create_room', ({ roomId, settings, user }) => {
      rooms.set(roomId, {
        id: roomId,
        settings,
        players: [{ id: socket.id, user, score: 0, hasAnsweredCurrent: false, eliminated: false }],
        status: 'waiting',
        currentQuestionIndex: 0,
        questions: []
      });
      socket.join(roomId);
      io.to(roomId).emit('room_update', rooms.get(roomId));
    });

    // ─────────────────────────── JOIN ROOM ────────────────────────────────
    socket.on('join_room', ({ roomId, user }) => {
      const room = rooms.get(roomId);
      if (room && room.status === 'waiting' && room.players.length < 4) {
        room.players.push({ id: socket.id, user, score: 0, hasAnsweredCurrent: false, eliminated: false });
        socket.join(roomId);
        io.to(roomId).emit('room_update', room);
      } else {
        socket.emit('error', 'Room is full or does not exist');
      }
    });

    // ─────────────────────────── START GAME ───────────────────────────────
    socket.on('start_game', ({ roomId, questions }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.status = 'playing';
      room.questions = questions;
      room.currentQuestionIndex = 0;

      io.to(roomId).emit('game_started', { questions: room.questions });

      const mode = room.settings.gameMode || 'competitive';

      if (mode === 'speedrun') {
        // ⚡ Speedrun: only a global countdown. No per-question timer.
        // Questions advance the instant all players have submitted.
        startSpeedrunTimer(io, roomId);
      } else {
        startQuestionTimer(io, roomId, room.settings.timer);
      }
    });

    // ─────────────────────────── SUBMIT ANSWER ────────────────────────────
    socket.on('submit_answer', ({ roomId, isCorrect }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.hasAnsweredCurrent || player.eliminated) return;

      player.hasAnsweredCurrent = true;
      const mode = room.settings.gameMode || 'competitive';

      // ── Score the answer ──────────────────────────────────────────────
      if (mode === 'survival') {
        if (isCorrect) {
          player.score += (room.settings.correctPoints || 10);
          io.to(roomId).emit('player_answered', { username: player.user.username, isCorrect: true });
        } else {
          player.eliminated = true;
          io.to(roomId).emit('player_eliminated', { username: player.user.username });
          io.to(socket.id).emit('you_are_eliminated');

          const alive = room.players.filter(p => !p.eliminated);
          if (alive.length <= 1) {
            setTimeout(() => endGame(io, roomId), 1500);
            return;
          }
        }
      } else {
        // Competitive + Speedrun
        if (isCorrect) {
          player.score += (room.settings.correctPoints || 10);
          player.isCorrectForCurrent = true;
          io.to(roomId).emit('player_answered', { username: player.user.username, isCorrect: true });
        } else {
          if ((room.settings.wrongPoints || 0) > 0) player.score -= room.settings.wrongPoints;
          io.to(roomId).emit('player_answered', { username: player.user.username, isCorrect: false });
        }
      }

      io.to(roomId).emit('room_update', room);

      // ── Advance question ──────────────────────────────────────────────
      const active = room.players.filter(p => !p.eliminated);
      const allAnswered = active.every(p => p.hasAnsweredCurrent);

      if (allAnswered) {
        if (mode === 'speedrun') {
          // Advance immediately (tiny delay for feedback flash)
          setTimeout(() => nextQuestion(io, roomId), 600);
        } else {
          setTimeout(() => nextQuestion(io, roomId), 1500);
        }
      }
    });

    // ─────────────────────────── DISCONNECT ───────────────────────────────
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      for (const [roomId, room] of rooms.entries()) {
        const idx = room.players.findIndex(p => p.id === socket.id);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
            clearRoomTimers(roomId);
            clearSpeedrunTimer(roomId);
          } else {
            io.to(roomId).emit('room_update', room);
          }
          break;
        }
      }
    });
  });

  // ──────────────────────── PER-QUESTION TIMER ──────────────────────────
  // Used only for Competitive and Survival modes
  const startQuestionTimer = (io, roomId, duration) => {
    clearRoomTimers(roomId);

    let timeLeft = duration;
    const interval = setInterval(() => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') { clearInterval(interval); return; }

      timeLeft--;
      io.to(roomId).emit('timer_update', timeLeft);

      if (timeLeft <= 0) {
        clearInterval(interval);
        roomTimers.delete(roomId);

        const mode = room.settings.gameMode || 'competitive';

        if (mode === 'survival') {
          // Unanswered players are eliminated
          const unanswered = room.players.filter(p => !p.hasAnsweredCurrent && !p.eliminated);
          unanswered.forEach(p => {
            p.eliminated = true;
            io.to(roomId).emit('player_eliminated', { username: p.user.username });
            io.to(p.id).emit('you_are_eliminated');
          });
          io.to(roomId).emit('room_update', room);

          const alive = room.players.filter(p => !p.eliminated);
          if (alive.length <= 1) {
            setTimeout(() => endGame(io, roomId), 1500);
          } else {
            setTimeout(() => nextQuestion(io, roomId), 1500);
          }
        } else {
          nextQuestion(io, roomId);
        }
      }
    }, 1000);

    roomTimers.set(roomId, interval);
  };

  // ─────────────────── SPEEDRUN GLOBAL COUNTDOWN ────────────────────────
  const startSpeedrunTimer = (io, roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    let globalTimeLeft = room.settings.speedrunTime || 60;

    const interval = setInterval(() => {
      const r = rooms.get(roomId);
      if (!r || r.status !== 'playing') { clearInterval(interval); return; }

      globalTimeLeft--;
      io.to(roomId).emit('speedrun_timer_update', globalTimeLeft);

      if (globalTimeLeft <= 0) {
        clearInterval(interval);
        speedrunTimers.delete(roomId);
        endGame(io, roomId);
      }
    }, 1000);

    speedrunTimers.set(roomId, interval);
  };

  // ─────────────────────────── NEXT QUESTION ────────────────────────────
  const nextQuestion = (io, roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    clearRoomTimers(roomId);

    room.currentQuestionIndex++;
    room.players.forEach(p => {
      p.hasAnsweredCurrent = false;
      p.isCorrectForCurrent = false;
    });

    const mode = room.settings.gameMode || 'competitive';

    if (mode === 'speedrun') {
      // Loop the question pool indefinitely — only the global timer ends the game
      room.currentQuestionIndex = room.currentQuestionIndex % room.questions.length;
      io.to(roomId).emit('next_question', { questionIndex: room.currentQuestionIndex });
      // No per-question timer emitted in speedrun
      return;
    }

    if (room.currentQuestionIndex >= room.questions.length) {
      endGame(io, roomId);
    } else {
      io.to(roomId).emit('next_question', { questionIndex: room.currentQuestionIndex });
      startQuestionTimer(io, roomId, room.settings.timer);
    }
  };

  // ───────────────────────────── END GAME ───────────────────────────────
  const endGame = (io, roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    clearRoomTimers(roomId);
    clearSpeedrunTimer(roomId);

    room.status = 'finished';
    io.to(roomId).emit('game_over', { players: room.players });
    rooms.delete(roomId);
  };

  // ─────────────────────────── HELPERS ──────────────────────────────────
  const clearRoomTimers = (roomId) => {
    if (roomTimers.has(roomId)) {
      clearInterval(roomTimers.get(roomId));
      roomTimers.delete(roomId);
    }
  };

  const clearSpeedrunTimer = (roomId) => {
    if (speedrunTimers.has(roomId)) {
      clearInterval(speedrunTimers.get(roomId));
      speedrunTimers.delete(roomId);
    }
  };
};

module.exports = initSocket;
