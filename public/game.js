// Connect to the server
const socket = io();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const colorPicker = document.getElementById('color-picker');
const usernameInput = document.getElementById('username');
const gameIdInput = document.getElementById('game-id');
const gameIdDisplay = document.getElementById('game-id-display');
const playerList = document.getElementById('player-list');
const playerHand = document.getElementById('player-hand');
const discardPile = document.getElementById('discard-pile');
const opponentsArea = document.getElementById('opponents-area');
const gameStatus = document.getElementById('game-status');
const currentGameIdDisplay = document.getElementById('current-game-id-game-screen'); // New element for displaying game ID

// Game state
let currentGameId = null;
let myUsername = null;
let myHand = [];
let selectedCardIndex = null;
let isMyTurn = false;
let pendingWildCard = null;
let isSelectingColor = false; // New flag to track color selection process

// Event Listeners
document.getElementById('create-game').addEventListener('click', createGame);
document.getElementById('join-game').addEventListener('click', joinGame);
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('draw-card').addEventListener('click', drawCard);
const toggleAudioBtn = document.getElementById('toggle-audio');
if (toggleAudioBtn) {
  toggleAudioBtn.addEventListener('click', toggleAudio);
}

const leaveAudioChatBtn = document.getElementById('leave-audio-chat');
if (leaveAudioChatBtn) {
  leaveAudioChatBtn.addEventListener('click', leaveAudioChat);
}

// Color picker buttons
document.querySelectorAll('.color-btn').forEach(button => {
    button.addEventListener('click', () => {
        const color = button.getAttribute('data-color');
        selectWildCardColor(color);
    });
});

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
    myUsername = usernameInput.value.trim();
    const gameId = gameIdInput.value.trim();
    
    if (!myUsername || !gameId) {
        alert('Please enter both username and game ID');
        return;
    }
    
    currentGameId = gameId;
    socket.emit('joinGame', { gameId, username: myUsername });
}

// Start the game
function startGame() {
    socket.emit('startGame', currentGameId);
}

// Draw a card from the deck
function drawCard() {
    if (!isMyTurn) {
        showMessage('Not your turn!');
        return;
    }
    
    socket.emit('drawCard', currentGameId);
}

// Play a card
function playCard(index) {
    if (!isMyTurn) {
        showMessage('Not your turn!');
        return;
    }
    
    const card = myHand[index];
    
    // If it's a wild card, store the index and show color picker
    if (card.color === 'wild') {
        pendingWildCard = index;
        
        // For draw four cards, we need to include the color in the playCard event
        if (card.value === 'draw four') {
            colorPicker.style.display = 'block';
        } else {
            // For regular wild cards, just show the color picker
            colorPicker.style.display = 'block';
        }
        return;
    }
    
    // For non-wild cards, send playCard event immediately
    socket.emit('playCard', {
        gameId: currentGameId,
        cardIndex: index
    });
    
    // Simple animation without relying on gameAnimations
    const cardElement = document.querySelector(`#player-hand .card:nth-child(${index + 1})`);
    if (cardElement) {
        // Create a clone for animation
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.zIndex = '1000';
        
        // Get positions
        const rect = cardElement.getBoundingClientRect();
        const discardRect = document.getElementById('discard-pile').getBoundingClientRect();
        
        // Set initial position
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        
        // Add to body
        document.body.appendChild(clone);
        
        // Animate
        setTimeout(() => {
            clone.style.transition = 'all 0.5s ease-in-out';
            clone.style.top = `${discardRect.top}px`;
            clone.style.left = `${discardRect.left}px`;
        }, 10);
        
        // Remove after animation
        setTimeout(() => {
            clone.remove();
        }, 600);
    }
}

// Select color for wild card
function selectWildCardColor(color) {
    if (pendingWildCard === null) return;
    
    const card = myHand[pendingWildCard];
    const cardIndex = pendingWildCard;
    
    // Set flag to indicate we're handling a color selection
    isSelectingColor = true;
    
    // Hide the color picker immediately
    colorPicker.style.display = 'none';
    
    // Reset pendingWildCard before any async operations
    pendingWildCard = null;
    
    // Play the card with the selected color
    socket.emit('playCard', {
        gameId: currentGameId,
        cardIndex: cardIndex
    });
    
    // For draw four cards, we need to handle the color differently
    if (card && card.value === 'draw four') {
        // For draw four, we need to send the color immediately
        socket.emit('selectColor', {
            gameId: currentGameId,
            color: color
        });
        
        // Reset the flag after a delay to allow server processing
        setTimeout(() => {
            isSelectingColor = false;
        }, 500);
    } else {
        // For regular wild cards, wait a bit before sending the color
        setTimeout(() => {
            socket.emit('selectColor', {
                gameId: currentGameId,
                color: color
            });
            
            // Reset the flag after sending the color
            setTimeout(() => {
                isSelectingColor = false;
            }, 400);
        }, 100);
    }
}

// Update the player's hand display
function updatePlayerHand() {
    playerHand.innerHTML = '';
    
    myHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.color}`;
        cardElement.innerHTML = `<span>${card.value}</span>`;
        
        // Add click event to play the card
        cardElement.addEventListener('click', () => playCard(index));
        
        playerHand.appendChild(cardElement);
    });
}

// Update the discard pile display
function updateDiscardPile(card) {
    discardPile.innerHTML = '';
    
    const cardElement = document.createElement('div');
    
    // Use the selected color for wild cards if available
    const displayColor = card.selectedColor || card.color;
    cardElement.className = `card ${displayColor}`;
    cardElement.innerHTML = `<span>${card.value}</span>`;
    
    discardPile.appendChild(cardElement);
}

// Update opponents display
function updateOpponents(players) {
    opponentsArea.innerHTML = '';
    
    players.forEach(player => {
        if (player.username !== myUsername) {
            const opponentElement = document.createElement('div');
            opponentElement.className = 'opponent';
            opponentElement.innerHTML = `
                <div class="opponent-name">${player.username}</div>
                <div class="opponent-cards">${player.cardCount} cards</div>
            `;
            
            opponentsArea.appendChild(opponentElement);
        }
    });
}

// Show a message in the game status area
function showMessage(message) {
    gameStatus.innerText = message;
    
    // Clear message after 10 seconds
    setTimeout(() => {
        gameStatus.innerText = '';
    }, 10000);
}

// Socket event handlers
socket.on('gameCreated', (gameId) => {
    currentGameId = gameId;
    gameIdDisplay.innerText = gameId;
    currentGameIdDisplay.innerText = gameId; // Update the current game ID display
    
    // Update player list
    playerList.innerHTML = `<li>${myUsername} (You)</li>`;
    
    // Show lobby screen
    gameAnimations.animateScreenTransition(loginScreen, lobbyScreen);
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

socket.on('gameStarted', (data) => {
    // Hide lobby, show game screen
    lobbyScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    
    // Set initial game state
    myHand = data.hand;
    updatePlayerHand();
    updateDiscardPile(data.currentCard);
    
    // Check if it's my turn
    isMyTurn = data.currentPlayer === myUsername;
    
    if (isMyTurn) {
        showMessage('Your turn!');
    } else {
        showMessage(`${data.currentPlayer}'s turn`);
    }
});

socket.on('updateGame', (data) => {
    // Update hand
    myHand = data.hand;
    updatePlayerHand();
    
    // Update discard pile
    updateDiscardPile(data.currentCard);
    
    // Update opponents
    updateOpponents(data.players);
    
    // Check if it's my turn
    isMyTurn = data.currentPlayer === myUsername;
    
    if (isMyTurn) {
        showMessage('Your turn!');
    } else {
        showMessage(`${data.currentPlayer}'s turn`);
    }
});

// Update the socket.on('selectColor') handler
socket.on('selectColor', () => {
    // Only show color picker if we're not already handling a wild card
    // and not in the process of selecting a color
    if (pendingWildCard === null && !isSelectingColor) {
        gameAnimations.animateColorPicker();
        colorPicker.style.display = 'block';
    }
});

socket.on('cardDrawn', (card) => {
    showMessage('You drew a card');
});

socket.on('gameOver', (data) => {
    const message = data.winner === myUsername ?
        'Congratulations! You won!' :
        `Game over! ${data.winner} won.`;
    
    alert(message);
    
    // Reset game state
    myHand = [];
    selectedCardIndex = null;
    isMyTurn = false;
    
    // Show login screen
    gameScreen.style.display = 'none';
    loginScreen.style.display = 'block';
});

socket.on('playerLeft', (data) => {
    // Update player list in lobby
    if (lobbyScreen.style.display !== 'none') {
        playerList.innerHTML = '';
        data.players.forEach(player => {
            const isYou = player === myUsername;
            playerList.innerHTML += `<li>${player}${isYou ? ' (You)' : ''}</li>`;
        });
    }
    
    // Update opponents in game
    if (gameScreen.style.display !== 'none') {
        updateOpponents(data.players.map(p => ({ username: p, cardCount: '?' })));
    }
    
    showMessage('A player has left the game');
});

socket.on('error', (message) => {
    showMessage(message);
});
// Create audio control buttons dynamically
function toggleAudio() {
  if (window.localStream) {
    const audioTrack = window.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      document.getElementById('toggle-audio').textContent =
        audioTrack.enabled ? 'Mute' : 'Unmute';
    }
  }
}

function createAudioControls() {
    const gameScreen = document.getElementById('game-screen');
    
    // Create container
    const audioControls = document.createElement('div');
    audioControls.className = 'audio-controls';
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-audio';
    toggleBtn.className = 'btn';
    toggleBtn.textContent = 'Mute';
    toggleBtn.addEventListener('click', toggleAudio);
    
    // Create leave button
    const leaveBtn = document.createElement('button');
    leaveBtn.id = 'leave-audio-chat';
    leaveBtn.className = 'btn';
    leaveBtn.textContent = 'Leave Audio Chat';
    leaveBtn.addEventListener('click', leaveAudioChat);
    
    // Add buttons to container
    audioControls.appendChild(toggleBtn);
    audioControls.appendChild(leaveBtn);
    
    // Add container to game screen
    gameScreen.appendChild(audioControls);
  }
  
  // Call this function when the game starts
  socket.on('gameStarted', (data) => {
    // Your existing gameStarted code...
    
    // Create audio controls
    createAudioControls();
  });
  