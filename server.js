const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state with better error handling
const games = {};

// Keno game constants
const KENO_MIN_NUMBER = 1;
const KENO_MAX_NUMBER = 80;
const NUMBERS_TO_DRAW = 20;
const DRAW_INTERVAL = 180000; // 3 minutes in milliseconds
const BETTING_PHASE_DURATION = 120000; // 2 minutes for betting

function generateGameId() {
  const id = Math.random().toString(36).substring(2, 8).toUpperCase();
  return games[id] ? generateGameId() : id;
}

// Generate Keno numbers (1-80)
function generateAllKenoNumbers() {
  const numbers = [];
  for (let i = KENO_MIN_NUMBER; i <= KENO_MAX_NUMBER; i++) {
    numbers.push(i);
  }
  return numbers;
}

// Draw random numbers for Keno
function drawKenoNumbers() {
  const numbers = generateAllKenoNumbers();
  const drawnNumbers = [];
  
  for (let i = 0; i < NUMBERS_TO_DRAW; i++) {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    drawnNumbers.push(numbers[randomIndex]);
    numbers.splice(randomIndex, 1);
  }
  
  return drawnNumbers.sort((a, b) => a - b);
}

// Calculate winnings based on matches and bet amount
function calculateWinnings(selectedNumbers, drawnNumbers, betAmount) {
  const matches = selectedNumbers.filter(num => drawnNumbers.includes(num)).length;
  
  // Standard Keno payout table (adjust as needed)
  const payoutTable = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 2,
    5: 10,
    6: 50,
    7: 150,
    8: 1000,
    9: 5000,
    10: 25000
  };
  
  const multiplier = payoutTable[matches] || 0;
  return betAmount * multiplier;
}

// Initialize new Keno game
function initializeGame(gameId) {
  games[gameId] = {
    id: gameId,
    players: [],
    gameState: 'betting', // betting, drawing, results
    roundNumber: 0,
    selectedNumbers: {}, // playerId -> {numbers: [], betAmount: number}
    drawnNumbers: [],
    bettingStartTime: Date.now(),
    nextDrawTime: Date.now() + BETTING_PHASE_DURATION,
    drawInterval: null,
    results: {} // playerId -> {matches, winnings, selectedNumbers, drawnNumbers}
  };
  
  // Start the drawing cycle
  startDrawingCycle(gameId);
}

// Start automatic drawing cycle
function startDrawingCycle(gameId) {
  const game = games[gameId];
  if (!game) return;
  
  // Clear existing interval
  if (game.drawInterval) {
    clearInterval(game.drawInterval);
  }
  
  game.drawInterval = setInterval(() => {
    const now = Date.now();
    
    if (game.gameState === 'betting' && now >= game.nextDrawTime) {
      // Start drawing phase
      startDrawingPhase(gameId);
    } else if (game.gameState === 'drawing' && now >= game.nextDrawTime) {
      // Complete drawing and show results
      completeDrawingPhase(gameId);
    }
  }, 1000); // Check every second
}

// Start drawing phase
function startDrawingPhase(gameId) {
  const game = games[gameId];
  if (!game) return;
  
  game.gameState = 'drawing';
  game.roundNumber++;
  game.drawnNumbers = drawKenoNumbers();
  game.nextDrawTime = Date.now() + 30000; // 30 seconds for drawing animation
  
  // Notify all players that drawing has started
  io.to(gameId).emit('drawingStarted', {
    drawnNumbers: game.drawnNumbers,
    roundNumber: game.roundNumber
  });
}

// Complete drawing phase and calculate results
function completeDrawingPhase(gameId) {
  const game = games[gameId];
  if (!game) return;
  
  game.gameState = 'results';
  
  // Calculate results for each player
  game.results = {};
  game.players.forEach(player => {
    const playerBets = game.selectedNumbers[player.id] || { numbers: [], betAmount: 0 };
    const matches = playerBets.numbers.filter(num => game.drawnNumbers.includes(num)).length;
    const winnings = calculateWinnings(playerBets.numbers, game.drawnNumbers, playerBets.betAmount);
    
    game.results[player.id] = {
      matches,
      winnings,
      selectedNumbers: playerBets.numbers,
      drawnNumbers: game.drawnNumbers,
      betAmount: playerBets.betAmount
    };
  });
  
  // Send results to all players
  io.to(gameId).emit('roundResults', {
    results: game.results,
    drawnNumbers: game.drawnNumbers,
    roundNumber: game.roundNumber
  });
  
  // Reset for next round after showing results
  setTimeout(() => {
    startNextRound(gameId);
  }, 15000); // Show results for 15 seconds
}

// Start next betting round
function startNextRound(gameId) {
  const game = games[gameId];
  if (!game) return;
  
  game.gameState = 'betting';
  game.selectedNumbers = {};
  game.drawnNumbers = [];
  game.results = {};
  game.bettingStartTime = Date.now();
  game.nextDrawTime = Date.now() + BETTING_PHASE_DURATION;
  
  // Notify all players that new round has started
  io.to(gameId).emit('newRound', {
    gameState: game.gameState,
    nextDrawTime: game.nextDrawTime,
    roundNumber: game.roundNumber,
    serverTime: Date.now() // Include server timestamp for synchronization
  });
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create a new game with better error handling
  socket.on('createGame', (username) => {
    try {
      const gameId = generateGameId();
      games[gameId] = {
        id: gameId,
        players: [{id: socket.id, username}],
        gameState: 'drawing', // Start with drawing immediately
        roundNumber: 0,
        selectedNumbers: {},
        drawnNumbers: [],
        bettingStartTime: Date.now(),
        nextDrawTime: Date.now() + 30000, // Start drawing in 30 seconds
        drawInterval: null,
        results: {}
      };
      
      initializeGame(gameId);
      socket.join(gameId);
      socket.emit('gameCreated', gameId);
      
      // Send current game state immediately to creator
      const game = games[gameId];
      socket.emit('gameJoined', {
        gameId,
        gameState: game.gameState,
        roundNumber: game.roundNumber,
        nextDrawTime: game.nextDrawTime,
        serverTime: Date.now(), // Include server timestamp for synchronization
        players: games[gameId].players.map(p => p.username)
      });
      
      console.log(`Keno game created: ${gameId} by ${username}`);
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('error', 'Failed to create game');
    }
  });

  // Join existing game
  socket.on('joinGame', (data) => {
    try {
      const { gameId, username } = data;
      
      if (!games[gameId]) {
        socket.emit('error', 'Game not found');
        return;
      }
      
      games[gameId].players.push({id: socket.id, username});
      socket.join(gameId);
      
      // Send current game state to newly joined player
      const game = games[gameId];
      socket.emit('gameJoined', {
        gameId,
        gameState: game.gameState,
        roundNumber: game.roundNumber,
        nextDrawTime: game.nextDrawTime,
        serverTime: Date.now(), // Include server timestamp for synchronization
        players: games[gameId].players.map(p => p.username)
      });
      
      // Notify all players about new player
      io.to(gameId).emit('playerJoined', {
        players: games[gameId].players.map(p => p.username)
      });
      
      console.log(`Player ${username} joined Keno game: ${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', 'Failed to join game');
    }
  });
  
  // Place bet and select numbers
  socket.on('placeBet', (data) => {
    try {
      const { gameId, selectedNumbers, betAmount } = data;
      const game = games[gameId];
      
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }
      
      // Allow betting in both betting and drawing phases
      if (game.gameState === 'results') {
        socket.emit('error', 'Cannot place bet during results phase');
        return;
      }
      
      // Validate selected numbers
      if (!Array.isArray(selectedNumbers) || selectedNumbers.length === 0 || selectedNumbers.length > 15) {
        socket.emit('error', 'Select between 1 and 15 numbers');
        return;
      }
      
      // Validate number range
      const invalidNumbers = selectedNumbers.filter(num => num < KENO_MIN_NUMBER || num > KENO_MAX_NUMBER);
      if (invalidNumbers.length > 0) {
        socket.emit('error', 'Invalid numbers selected');
        return;
      }
      
      // Validate bet amount
      if (typeof betAmount !== 'number' || betAmount <= 0 || betAmount > 1000) {
        socket.emit('error', 'Invalid bet amount (must be between 1 and 1000)');
        return;
      }
      
      // Store player's bet
      game.selectedNumbers[socket.id] = {
        numbers: selectedNumbers,
        betAmount: betAmount
      };
      
      socket.emit('betPlaced', {
        selectedNumbers,
        betAmount
      });
      
      // Notify others about updated player count
      const playerBets = Object.keys(game.selectedNumbers).length;
      io.to(gameId).emit('bettingUpdate', {
        playersWithBets: playerBets,
        totalPlayers: game.players.length
      });
      
    } catch (error) {
      console.error('Error placing bet:', error);
      socket.emit('error', 'Failed to place bet');
    }
  });
  
  // Get current game state
  socket.on('getGameState', (gameId) => {
    try {
      const game = games[gameId];
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }
      
      const playerBet = game.selectedNumbers[socket.id] || { numbers: [], betAmount: 0 };
      
      socket.emit('gameState', {
        gameState: game.gameState,
        roundNumber: game.roundNumber,
        nextDrawTime: game.nextDrawTime,
        drawnNumbers: game.drawnNumbers,
        selectedNumbers: playerBet.numbers,
        betAmount: playerBet.betAmount,
        playersWithBets: Object.keys(game.selectedNumbers).length,
        totalPlayers: game.players.length,
        serverTime: Date.now() // Include server timestamp for synchronization
      });
      
    } catch (error) {
      console.error('Error getting game state:', error);
      socket.emit('error', 'Failed to get game state');
    }
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove player from any games they're in
    for (const gameId in games) {
      const game = games[gameId];
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        delete game.selectedNumbers[socket.id];
        delete game.results[socket.id];
        
        if (game.players.length === 0) {
          // Clean up game if no players left
          if (game.drawInterval) {
            clearInterval(game.drawInterval);
          }
          delete games[gameId];
        } else {
          // Notify remaining players
          io.to(gameId).emit('playerLeft', {
            players: game.players.map(p => p.username),
            playersWithBets: Object.keys(game.selectedNumbers).length,
            totalPlayers: game.players.length
          });
        }
      }
    }
  });

  // Handle chat messages
  socket.on('send-chat', (messageData) => {
    io.to(messageData.gameId).emit('chat-message', messageData);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Keno server running on port ${PORT}`);
});

// Export the serverless function
module.exports.handler = serverless(app);
