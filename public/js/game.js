// Initialize socket connection
const socket = io();
window.gameSocket = socket; // Make socket available globally

// Initialize chat when game starts
function initializeChat(gameId, username) {
  console.log('Attempting to initialize chat for', gameId, username);
  if (window.chatSystem && typeof window.chatSystem.init === 'function') {
    window.chatCleanup = window.chatSystem.init(gameId, username);
    console.log('Chat initialized successfully');
  } else {
    console.error('Chat system not available');
  }
}

// Add connection event handlers
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const usernameInput = document.getElementById('username');
const gameIdInput = document.getElementById('game-id');
const gameIdDisplay = document.getElementById('game-id-display');
const playerList = document.getElementById('player-list');
const gameStatus = document.getElementById('game-status');
const timerDisplay = document.getElementById('timer-display');
const selectedNumbersList = document.getElementById('selected-numbers-list');
const currentBetDisplay = document.getElementById('current-bet');
const playersCount = document.getElementById('players-count');
const playersBets = document.getElementById('players-bets');
const currentGameIdDisplay = document.getElementById('current-game-id-game-screen');

// Game state
let currentGameId = null;
let myUsername = null;
let selectedNumbers = [];
let currentBetAmount = 0;
let gameTimer = null;

// Event Listeners
document.getElementById('create-game').addEventListener('click', createGame);
document.getElementById('join-game').addEventListener('click', joinGame);
document.getElementById('place-bet').addEventListener('click', placeBet);
document.getElementById('clear-selection').addEventListener('click', clearSelection);
document.getElementById('quick-pick').addEventListener('click', quickPickNumbers);

// Chip selection event listeners
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', function() {
    selectChip(parseInt(this.dataset.amount));
  });
});

// Clean up when leaving a game
function leaveGame() {
  // Clear any intervals
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
  
  // Clean up chat
  if (window.chatCleanup && typeof window.chatCleanup === 'function') {
    window.chatCleanup();
  }
  
  // Reset local state
  selectedNumbers = [];
  currentBetAmount = 0;
  updateSelectedNumbersDisplay();
  updateCurrentBetDisplay();
}

// Toggle number selection in Keno grid
function toggleNumberSelection(number) {
  if (selectedNumbers.includes(number)) {
    selectedNumbers = selectedNumbers.filter(n => n !== number);
  } else {
    if (selectedNumbers.length >= 15) {
      showMessage('You can only select up to 15 numbers!');
      return;
    }
    selectedNumbers.push(number);
  }
  
  selectedNumbers.sort((a, b) => a - b);
  updateNumberDisplay();
  updateSelectedNumbersDisplay();
}

// Update visual display of selected numbers
function updateNumberDisplay() {
  document.querySelectorAll('.keno-number').forEach(numElement => {
    const num = parseInt(numElement.dataset.number);
    if (selectedNumbers.includes(num)) {
      numElement.classList.add('selected');
    } else {
      numElement.classList.remove('selected');
    }
  });
}

// Update selected numbers display
function updateSelectedNumbersDisplay() {
  selectedNumbersList.textContent = selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'None selected';
}

// Select betting chip
function selectChip(amount) {
  currentBetAmount = amount;
  updateCurrentBetDisplay();
  
  // Update chip visual selection
  document.querySelectorAll('.chip').forEach(chip => {
    if (parseInt(chip.dataset.amount) === amount) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });
}

// Update current bet display
function updateCurrentBetDisplay() {
  currentBetDisplay.textContent = currentBetAmount;
}

// Clear number selection
function clearSelection() {
  selectedNumbers = [];
  currentBetAmount = 0;
  updateNumberDisplay();
  updateSelectedNumbersDisplay();
  updateCurrentBetDisplay();
  
  // Clear chip selection
  document.querySelectorAll('.chip').forEach(chip => {
    chip.classList.remove('selected');
  });
}

// Quick pick numbers
function quickPickNumbers() {
  // Clear current selection first
  clearSelection();
  
  // Generate random number of numbers (1-15)
  const numCount = Math.floor(Math.random() * 15) + 1;
  
  // Create array of numbers 1-80 and shuffle them
  const numbers = Array.from({length: 80}, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  
  // Select the first numCount numbers
  selectedNumbers = numbers.slice(0, numCount).sort((a, b) => a - b);
  
  updateNumberDisplay();
  updateSelectedNumbersDisplay();
  
  // Provide feedback
  showMessage(`Quick pick selected ${numCount} numbers!`);
}

// Create a new game
function createGame() {
  myUsername = usernameInput.value.trim();
  if (!myUsername) {
    alert('Please enter a username');
    return;
  }
  
  socket.emit('createGame', myUsername);
}

// Join an existing game
function joinGame() {
  const username = usernameInput.value.trim();
  const gameId = gameIdInput.value.trim().toUpperCase();
  
  if (!username) {
    showError('Please enter a username');
    return;
  }
  
  if (!gameId) {
    showError('Please enter a game ID');
    return;
  }
  
  myUsername = username;
  currentGameId = gameId;
  
  socket.emit('joinGame', { gameId, username });
}

// Place bet
function placeBet() {
  if (selectedNumbers.length === 0) {
    showMessage('Please select at least one number!');
    return;
  }
  
  if (currentBetAmount <= 0) {
    showMessage('Please select a bet amount!');
    return;
  }
  
  if (selectedNumbers.length > 15) {
    showMessage('You can only select up to 15 numbers!');
    return;
  }
  
  socket.emit('placeBet', {
    gameId: currentGameId,
    selectedNumbers: selectedNumbers,
    betAmount: currentBetAmount
  });
}

// Update timer display with server time synchronization
function updateTimer(nextDrawTime, serverTime = null) {
  // Use server time if provided to account for network latency
  const now = serverTime || Date.now();
  const timeLeft = nextDrawTime - now;
  
  if (timeLeft <= 0) {
    timerDisplay.textContent = 'Drawing numbers...';
    return;
  }
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  timerDisplay.textContent = `Next draw in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Start timer updates with server time synchronization
function startTimer(nextDrawTime, serverTime = null) {
  if (gameTimer) {
    clearInterval(gameTimer);
  }
  
  // Calculate initial time offset between server and client
  const clientTime = Date.now();
  const serverTimestamp = serverTime || clientTime;
  const timeOffset = clientTime - serverTimestamp;
  
  updateTimer(nextDrawTime);
  gameTimer = setInterval(() => {
    // Use server time plus offset for synchronized countdown
    const synchronizedServerTime = Date.now() - timeOffset;
    updateTimer(nextDrawTime, synchronizedServerTime);
  }, 1000);
}

// Show drawn numbers with animation
function showDrawnNumbers(drawnNumbers) {
  const drawingDisplay = document.getElementById('drawing-display');
  const drawnNumbersContainer = document.getElementById('drawn-numbers');
  
  drawingDisplay.style.display = 'block';
  drawnNumbersContainer.innerHTML = '';
  
  // Animate numbers appearing one by one
  drawnNumbers.forEach((number, index) => {
    setTimeout(() => {
      const numberElement = document.createElement('div');
      numberElement.className = 'drawn-number';
      numberElement.textContent = number;
      drawnNumbersContainer.appendChild(numberElement);
      
      // Mark number in the grid
      const gridNumber = document.querySelector(`[data-number="${number}"]`);
      if (gridNumber) {
        gridNumber.classList.add('drawn');
      }
    }, index * 200); // Stagger the animations
  });
  
  // Highlight matches
  setTimeout(() => {
    highlightMatches();
  }, drawnNumbers.length * 200 + 1000);
}

// Highlight matching numbers
function highlightMatches() {
  selectedNumbers.forEach(number => {
    const gridNumber = document.querySelector(`[data-number="${number}"]`);
    if (gridNumber && gridNumber.classList.contains('drawn')) {
      gridNumber.classList.add('match');
    }
  });
}

// Show round results
function showRoundResults(results) {
  const resultsDisplay = document.getElementById('results-display');
  const resultsContent = document.getElementById('results-content');
  
  resultsDisplay.style.display = 'block';
  resultsContent.innerHTML = '';
  
  // Find current player's result
  const myResult = results.find(r => r.username === myUsername);
  
  if (myResult) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-player';
    if (myResult.winnings > 0) {
      resultDiv.classList.add('winner');
    }
    
    resultDiv.innerHTML = `
      <h4>${myResult.username} (You)</h4>
      <p>Selected: ${myResult.selectedNumbers.join(', ')}</p>
      <p>Matches: ${myResult.matches} out of ${myResult.selectedNumbers.length}</p>
      <p>Bet: $${myResult.betAmount}</p>
      <p class="result-payout">Winnings: $${myResult.winnings}</p>
    `;
    
    resultsContent.appendChild(resultDiv);
  }
  
  // Show other players' results
  results.forEach(result => {
    if (result.username !== myUsername) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'result-player';
      if (result.winnings > 0) {
        resultDiv.classList.add('winner');
      }
      
      resultDiv.innerHTML = `
        <h4>${result.username}</h4>
        <p>Matches: ${result.matches} out of ${result.selectedNumbers.length}</p>
        <p class="result-payout">Winnings: $${result.winnings}</p>
      `;
      
      resultsContent.appendChild(resultDiv);
    }
  });
}

// Show a message in the game status area
function showMessage(message) {
  gameStatus.innerText = message;
  
  // Clear message after 5 seconds
  setTimeout(() => {
    gameStatus.innerText = '';
  }, 5000);
}

// Show error message
function showError(message) {
  gameStatus.innerText = message;
  gameStatus.style.color = '#f44336';
  
  setTimeout(() => {
    gameStatus.innerText = '';
    gameStatus.style.color = '#4CAF50';
  }, 5000);
}

// Socket event handlers
socket.on('gameCreated', (gameId) => {
  currentGameId = gameId;
  gameIdDisplay.innerText = gameId;
  currentGameIdDisplay.innerText = gameId;
  
  // Update player list
  playerList.innerHTML = `<li>${myUsername} (You)</li>`;
  
  // Show lobby screen
  loginScreen.style.display = 'none';
  lobbyScreen.style.display = 'block';
});

socket.on('playerJoined', (data) => {
  // Update player list
  playerList.innerHTML = '';
  data.players.forEach(player => {
    const isYou = player === myUsername;
    playerList.innerHTML += `<li>${player}${isYou ? ' (You)' : ''}</li>`;
  });
  
  // Show lobby screen if not already visible
  if (loginScreen.style.display !== 'none') {
    loginScreen.style.display = 'none';
    lobbyScreen.style.display = 'block';
  }
});

socket.on('gameJoined', (data) => {
  currentGameId = data.gameId;
  gameIdDisplay.innerText = data.gameId;
  currentGameIdDisplay.innerText = data.gameId;
  
  // Initialize WhatsApp-style chat
  initializeChat(data.gameId, myUsername);
  
  // Add welcome message to chat
  if (window.chatSystem && window.chatSystem.addWelcomeMessage) {
    setTimeout(() => {
      window.chatSystem.addWelcomeMessage();
    }, 1000);
  }
  
  // Show game screen
  lobbyScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  // Start timer with server time synchronization
  startTimer(data.nextDrawTime, data.serverTime);
  
  // Update players count
  playersCount.textContent = data.totalPlayers;
  
  // Request current game state
  socket.emit('getGameState', currentGameId);
});

socket.on('gameState', (data) => {
  // Update timer with server time synchronization
  startTimer(data.nextDrawTime, data.serverTime);
  
  // Update players count
  playersCount.textContent = data.totalPlayers;
  playersBets.textContent = data.playersWithBets;
  
  // Restore selected numbers if any
  if (data.selectedNumbers && data.selectedNumbers.length > 0) {
    selectedNumbers = data.selectedNumbers;
    updateNumberDisplay();
    updateSelectedNumbersDisplay();
  }
  
  // Restore bet amount if any
  if (data.betAmount && data.betAmount > 0) {
    currentBetAmount = data.betAmount;
    updateCurrentBetDisplay();
    selectChip(currentBetAmount);
  }
  
  // Update game status with live drawing info
  switch (data.gameState) {
    case 'drawing':
      gameStatus.textContent = '🎱 Numbers being drawn! Place your bets for next round.';
      gameStatus.style.color = '#ff9800';
      showDrawnNumbers(data.drawnNumbers);
      break;
    case 'results':
      gameStatus.textContent = '🎉 Round complete! New round starting soon.';
      gameStatus.style.color = '#ffeb3b';
      break;
  }
});

socket.on('bettingUpdate', (data) => {
  playersCount.textContent = data.totalPlayers;
  playersBets.textContent = data.playersWithBets;
});

socket.on('betPlaced', (data) => {
  showMessage(`Bet placed! Selected: ${data.selectedNumbers.join(', ')} Bet: $${data.betAmount}`);
  
  // Disable betting controls temporarily
  document.getElementById('place-bet').disabled = true;
  document.querySelectorAll('.keno-number').forEach(num => {
    num.style.pointerEvents = 'none';
  });
});

socket.on('drawingStarted', (data) => {
  gameStatus.textContent = '🎱 Drawing live numbers! Watch the magic happen...';
  gameStatus.style.color = '#ff9800';
  
  // Clear previous drawings
  document.querySelectorAll('.keno-number').forEach(num => {
    num.classList.remove('drawn', 'match');
  });
  
  // Hide results
  document.getElementById('results-display').style.display = 'none';
  
  showDrawnNumbers(data.drawnNumbers);
});

socket.on('roundResults', (data) => {
  // Format results for display
  const formattedResults = [];
  
  Object.keys(data.results).forEach(playerId => {
    const result = data.results[playerId];
    const player = document.querySelector(`#player-list li:nth-child(${Object.keys(data.results).indexOf(playerId) + 1})`);
    const username = player ? player.textContent.replace(' (You)', '') : 'Unknown Player';
    
    formattedResults.push({
      username: username,
      matches: result.matches,
      selectedNumbers: result.selectedNumbers,
      drawnNumbers: result.drawnNumbers,
      betAmount: result.betAmount,
      winnings: result.winnings
    });
  });
  
  showRoundResults(formattedResults);
  
  // Re-enable betting controls
  document.getElementById('place-bet').disabled = false;
  document.querySelectorAll('.keno-number').forEach(num => {
    num.style.pointerEvents = 'auto';
  });
});

socket.on('newRound', (data) => {
  // Clear previous selections and results
  clearSelection();
  
  document.getElementById('drawing-display').style.display = 'none';
  document.getElementById('results-display').style.display = 'none';
  
  // Update timer with server time synchronization
  startTimer(data.nextDrawTime, data.serverTime);
  
  // Update game status
  gameStatus.textContent = '🚀 New round! Place your bets for the next draw.';
  gameStatus.style.color = '#4CAF50';
});

socket.on('playerLeft', (data) => {
  // Update player list
  playerList.innerHTML = '';
  data.players.forEach(player => {
    const isYou = player === myUsername;
    playerList.innerHTML += `<li>${player}${isYou ? ' (You)' : ''}</li>`;
  });
  
  // Update players count
  playersCount.textContent = data.totalPlayers;
  playersBets.textContent = data.playersWithBets;
});

socket.on('error', (message) => {
  showError(message);
});

// Handle chat messages
socket.on('send-chat', (messageData) => {
  io.to(messageData.gameId).emit('chat-message', messageData);
});