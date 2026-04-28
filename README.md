# CodeClash - Real-Time Skill Exchange Coding Game

## 🌟 Overview
CodeClash is a real-time multiplayer coding game where users can compete solo or in squads up to 4 players. Players are presented with "guess the output" programming questions, racing against the clock and each other to score points.

---

## 🛠 Prerequisites
- Node.js (v16+)
- MongoDB (Local instance or MongoDB Atlas)

---

## 🚀 Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables:
   Create a `.env` file in the `backend` directory (or use the existing `.env.example`) and add:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```
4. **Seed the Database with Sample Questions**:
   Run the seed script to populate your MongoDB database with the initial set of questions:
   ```bash
   node seed.js
   ```
5. Start the server:
   ```bash
   node server.js
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Environment Variables:
   Create a `.env` file in the `frontend` directory and add:
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to the local URL provided by Vite (usually `http://localhost:5173`).

---

## 🎮 How to Play
1. **Sign Up / Login**: Create an account to start playing.
2. **Dashboard**: Choose to "Create Arena" (Host) or "Join Squad" (Guest).
3. **Host a Game**: 
   - Select the programming language and difficulty.
   - Adjust the timer per question.
   - Toggle negative marking.
   - Click "Create & Enter Room".
4. **Invite Friends**: Share the 6-character room code with your friends to let them join.
5. **Gameplay**:
   - The host clicks "Start Game".
   - Read the code snippet and select the correct output.
   - The fastest correct answer gets 10 points. Subsequent correct answers get 5 points.
   - Watch out for negative marking if enabled!
   - At the end of the round, view the leaderboard to see who won.

---

## 🏗 Tech Stack
- **Frontend**: React, Tailwind CSS, Vite, Framer Motion, Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO, JWT
- **Database**: MongoDB (Mongoose)
