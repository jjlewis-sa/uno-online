    // Connect to the server with explicit URL in production
    const socket = io(window.location.origin, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

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

    document.addEventListener('DOMContentLoaded', () => {
      // Find the toggle audio button
      const toggleAudioBtn = document.getElementById('toggle-audio');
  
      // Add event listener if the button exists
      if (toggleAudioBtn) {
        toggleAudioBtn.addEventListener('click', handleAudioToggle);
      }
    });

    // Handle audio toggle button click
    function handleAudioToggle() {
      try {
        const toggleBtn = document.getElementById('toggle-audio');
        const statusEl = document.getElementById('audio-status');
    
        // Check if WebRTC is supported
        if (!isWebRTCSupported()) {
          alert('Your browser does not support audio chat. Please try using Chrome, Firefox, or Edge.');
          return;
        }
    
        // Check if we're in a secure context
        if (!isSecureContext()) {
          alert('Audio chat requires a secure connection (HTTPS). Please use HTTPS to enable audio chat.');
          return;
        }
    
        if (!audioInitialized) {
          // Initialize audio
          if (!currentGameId || !myUsername) {
            alert('Please join a game first to use audio chat.');
            return;
          }
      
          // Initialize audio chat
          initAudioChat(currentGameId, myUsername)
            .then(success => {
              if (success) {
                audioInitialized = true;
                audioEnabled = true;
                if (toggleBtn) toggleBtn.classList.remove('muted');
                if (statusEl) statusEl.textContent = 'Mic: On';
              }
            });
        } else {
          // Toggle mute if already initialized
          audioEnabled = toggleMute();
      
          if (toggleBtn) {
            toggleBtn.classList.toggle('muted', !audioEnabled);
          }
      
          if (statusEl) {
            statusEl.textContent = audioEnabled ? 'Mic: On' : 'Mic: Muted';
          }
        }
      } catch (error) {
        console.error('Error toggling audio:', error);
      }
    }

    // Clean up when leaving a game
    function leaveGame() {
      // Clean up audio chat
      if (audioInitialized) {
        cleanupAudioChat();
        audioInitialized = false;
        audioEnabled = false;
    
        const toggleBtn = document.getElementById('toggle-audio');
        const statusEl = document.getElementById('audio-status');
    
        if (toggleBtn) toggleBtn.classList.add('muted');
        if (statusEl) statusEl.textContent = 'Mic: Off';
      }
  
      // Other cleanup code...
    }// Update opponents display
    function updateOpponents(players) {
        console.log('Updating opponents with:', players);
    
        // Validate the DOM element
        if (!opponentsArea) {
            console.error('opponents-area element not found in the DOM');
            return;
        }
    
        // Clear the current opponents display
        opponentsArea.innerHTML = '';
    
        // Handle different possible data structures
        if (!players || !Array.isArray(players)) {
            console.error('Invalid players data:', players);
            return;
        }
    
        // Process each player
        players.forEach(player => {
            // Skip the current player
            const playerUsername = typeof player === 'object' ? player.username : player;
            const cardCount = player.cardCount !== undefined ? player.cardCount : '?';
        
            if (playerUsername !== myUsername) {
                const opponentElement = document.createElement('div');
                opponentElement.className = 'opponent';
                opponentElement.innerHTML = `
                    <div class="opponent-name">${playerUsername}</div>
                    <div class="opponent-cards">${cardCount} cards</div>
                `;
            
                opponentsArea.appendChild(opponentElement);
            }
        });
    
        // Log the result
        console.log('Opponents area updated with', opponentsArea.children.length, 'players');
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

          // Make socket available globally
          window.gameSocket = socket;

          // Initialize chat when game starts
          function initializeChat(gameId, username) {
            if (window.chatSystem && typeof window.chatSystem.init === 'function') {
              window.chatCleanup = window.chatSystem.init(gameId, username);
            } else {
              console.error('Chat system not available');
            }
          }

          // Add this to your existing socket event handlers
          socket.on('game-joined', (data) => {
            // Your existing code...
  
            // Get username from the input field
            const username = document.getElementById('username').value;
  
            // Initialize chat with game ID and username
            initializeChat(data.gameId, username);
          });

          // Clean up chat when game ends
          socket.on('game-ended', () => {
            // Your existing code...
  
            if (window.chatCleanup && typeof window.chatCleanup === 'function') {
              window.chatCleanup();
            }
          });

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
  
              // Initialize
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
                // We'll handle this in selectWildCardColor
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
    
        // Animate card play
        if (typeof gameAnimations !== 'undefined' && gameAnimations.animateCardPlay) {
            gameAnimations.animateCardPlay(card);
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

    // Show a message in the game status area
    function showMessage(message) {
        gameStatus.innerText = message;
    
        // Clear message after 10 seconds
        setTimeout(() => {
            gameStatus.innerText = '';
        }, 100000);
    }

    // Socket event handlers
    socket.on('gameCreated', (gameId) => {
        currentGameId = gameId;
        gameIdDisplay.innerText = gameId;
        currentGameIdDisplay.innerText = gameId; // Update the current game ID display
    
        // Update player list
        playerList.innerHTML = `<li>${myUsername} (You)</li>`;
    
        // Show lobby screen
        if (typeof gameAnimations !== 'undefined' && gameAnimations.animateScreenTransition) {
            gameAnimations.animateScreenTransition(loginScreen, lobbyScreen);
        } else {
            loginScreen.style.display = 'none';
            lobbyScreen.style.display = 'block';
        }
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
        if (data.players) {
            updateOpponents(data.players);
        }
    
        // Check if it's my turn
        isMyTurn = data.currentPlayer === myUsername;
    
        if (isMyTurn) {
            showMessage('Your turn!');
        
                    // Play turn notification sound
                    const turnSound = new Audio('../audio/mixkit-long-pop-2358.wav');
                    turnSound.volume = 0.5; // Set to 50% volume
                    turnSound.play();
        
        } else {
            showMessage(`${data.currentPlayer}'s turn`);
                    // Play turn notification sound
                    const turnSound = new Audio('../audio/mixkit-long-pop-2358.wav');
                    turnSound.volume = 0.5; // Set to 50% volume
                    turnSound.play();
        }
    });
    // Update the socket.on('selectColor') handler
    socket.on('selectColor', () => {
        // Only show color picker if we're not already handling a wild card
        // and not in the process of selecting a color
        if (pendingWildCard === null && !isSelectingColor) {
            if (typeof gameAnimations !== 'undefined' && gameAnimations.animateColorPicker) {
                gameAnimations.animateColorPicker();
            }
            colorPicker.style.display = 'block';
        }
    });

    socket.on('colorSelected', () => {
        // The server has processed the color selection
        isSelectingColor = false;
    });

    socket.on