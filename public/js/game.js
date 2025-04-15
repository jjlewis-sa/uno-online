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

// Global variables for audio chat
//let localStream = null;
let audioEnabled = false;
//let peers = {};
let audioCleanupFunction = null;


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
  toggleAudioBtn.addEventListener('click', () => toggleAudio(socket, currentGameId, myUsername));
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
    
    // Clean up audio
    leaveAudioChat();
    location.reload();
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

// Function to initialize audio chat
function initAudioChat(socket, gameId, username) {
    // Check if this is an Android device
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // Special constraints for Android
    const constraints = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: false
    };
    
    // Get user media (microphone)
    return navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            localStream = stream;
            audioEnabled = true;
            
            // Notify server we want to join audio chat
            socket.emit('request-audio-connect', { gameId, username });
            
            // Handle new users joining
            socket.on('user-joined-audio', data => {
                console.log('User joined audio:', data.username);
                // Create new peer connection
                const peer = createPeer(data.userId, socket.id, stream, socket, gameId, username);
                peers[data.userId] = peer;
            });
            
            // Handle incoming signals
            socket.on('audio-signal', data => {
                console.log('Received audio signal from:', data.username || data.from);
                if (data.from in peers) {
                    peers[data.from].signal(data.signal);
                } else {
                    const peer = addPeer(data.signal, data.from, stream, socket, gameId, username);
                    peers[data.from] = peer;
                }
            });
            
            // Return cleanup function
            return function cleanup() {
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                    localStream = null;
                }
                
                Object.values(peers).forEach(peer => {
                    if (peer && typeof peer.destroy === 'function') {
                        peer.destroy();
                    }
                });
                peers = {};
                
                // Remove event listeners
                socket.off('user-joined-audio');
                socket.off('audio-signal');
                audioEnabled = false;
            };
        })
        .catch(err => {
            console.error('Error accessing microphone:', err);
            
            // More descriptive error for Android users
            if (isAndroid) {
                let errorMsg = 'Could not access microphone on your Android device. ';
                if (err.name === 'NotAllowedError') {
                    errorMsg += 'You denied permission. Please check your browser settings to enable microphone access.';
                } else if (err.name === 'NotFoundError') {
                    errorMsg += 'No microphone found on your device.';
                } else if (err.name === 'NotReadableError') {
                    errorMsg += 'Your microphone is being used by another app. Please close other apps that might be using it.';
                } else {
                    errorMsg += `Error: ${err.message}`;
                }
                alert(errorMsg);
            } else {
                alert('Could not access microphone. Audio chat disabled.');
            }
            
            return function noop() {}; // Return empty cleanup function
        });
}

// Function to leave audio chat
function leaveAudioChat() {
    if (audioCleanupFunction) {
        audioCleanupFunction();
        audioCleanupFunction = null;
        
        const audioStatus = document.getElementById('audio-status');
        const toggleAudioBtn = document.getElementById('toggle-audio');
        
        if (audioStatus) audioStatus.textContent = 'Audio chat disabled';
        if (toggleAudioBtn) toggleAudioBtn.textContent = 'Enable Audio Chat';
        
        return true;
    }
    return false;
}

// Function to toggle audio chat
function toggleAudio(socket, gameId, username) {
    const audioButton = document.getElementById('toggle-audio');
    const audioStatus = document.getElementById('audio-status');
    
    if (!audioButton || !audioStatus) return;
    
    if (audioEnabled) {
        // Disable audio
        leaveAudioChat();
    } else {
        // Enable audio
        audioButton.disabled = true;
        audioButton.textContent = 'Connecting...';
        
        // Check if this is an Android device
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        // Request permissions explicitly first on Android
        if (isAndroid && navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' })
                .then(permissionStatus => {
                    if (permissionStatus.state === 'granted') {
                        startAudioChat();
                    } else {
                        // Show instructions for Android users
                        alert('Please grant microphone permission when prompted. If no prompt appears, check your browser settings.');
                        startAudioChat();
                    }
                })
                .catch(err => {
                    console.log('Permission API not supported, trying direct access');
                    startAudioChat();
                });
        } else {
            startAudioChat();
        }
    }
    
    function startAudioChat() {
        initAudioChat(socket, gameId, username)
            .then(cleanup => {
                audioCleanupFunction = cleanup;
                if (audioEnabled) {
                    audioButton.textContent = 'Disable Audio Chat';
                    audioStatus.textContent = 'Audio chat enabled';
                    audioStatus.className = 'status-enabled';
                }
            })
            .finally(() => {
                audioButton.disabled = false;
            });
    }
}

// Set up peer event handlers
function setupPeerEventHandlers(socket, gameId, username, stream) {
    // Handle new users joining
    socket.on('user-joined-audio', data => {
        console.log('User joined audio:', data.username);
        // Create new peer connection
        const peer = createPeer(data.userId, socket.id, stream, socket, gameId, username);
        peers[data.userId] = peer;
    });
    
    // Handle incoming signals
    socket.on('audio-signal', data => {
        console.log('Received audio signal from:', data.username || data.from);
        if (data.from in peers) {
            peers[data.from].signal(data.signal);
        } else {
            const peer = addPeer(data.signal, data.from, stream, socket, gameId, username);
            peers[data.from] = peer;
        }
    });
}

// Create a peer connection as initiator
function createPeer(userToSignal, callerId, stream, socket, gameId, username) {
    // Android-friendly configuration
    const peerConfig = {
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        }
    };
    
    const peer = new SimplePeer(peerConfig);
    
    peer.on('signal', signal => {
        console.log('Generated signal as initiator');
        socket.emit('audio-signal', {
            gameId,
            signal,
            username,
            userToSignal
        });
    });
    
    peer.on('connect', () => {
        console.log('Peer connection established with', userToSignal);
    });
    
    peer.on('stream', remoteStream => {
        console.log('Received remote stream');
        addAudioElement(remoteStream, userToSignal);
    });
    
    peer.on('error', err => {
        console.error('Peer error:', err);
    });
    
    return peer;
}

// Add a peer connection as receiver
function addPeer(incomingSignal, callerId, stream, socket, gameId, username) {
    // Android-friendly configuration
    const peerConfig = {
        initiator: false,
        trickle: false,
        stream: stream,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        }
    };
    
    const peer = new SimplePeer(peerConfig);
    
    peer.on('signal', signal => {
        console.log('Generated signal as receiver');
        socket.emit('audio-signal', {
            gameId,
            signal,
            username,
            to: callerId
        });
    });
    
    peer.on('connect', () => {
        console.log('Peer connection established with', callerId);
    });
    
    peer.on('stream', remoteStream => {
        console.log('Received remote stream');
        addAudioElement(remoteStream, callerId);
    });
    
    peer.on('error', err => {
        console.error('Peer error:', err);
    });
    
    // Accept the incoming signal
    peer.signal(incomingSignal);
    
    return peer;
}

// Adds an audio element to play the remote stream
function addAudioElement(stream, userId) {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.controls = false; // Hidden controls
    audio.id = `audio-${userId}`;
    document.body.appendChild(audio);
}

// Creates the audio controls UI
function createAudioControls(socket, gameId, username) {
    const audioControls = document.createElement('div');
    audioControls.className = 'audio-controls';
    
    const audioButton = document.createElement('button');
    audioButton.id = 'audio-button';
    audioButton.className = 'btn';
    audioButton.textContent = 'Enable Audio Chat';
    audioButton.onclick = () => toggleAudio(socket, gameId, username);
    
    const audioStatus = document.createElement('div');
    audioStatus.id = 'audio-status';
    audioStatus.className = 'status-disabled';
    audioStatus.textContent = 'Audio chat disabled';
    
    audioControls.appendChild(audioButton);
    audioControls.appendChild(audioStatus);
    
    return audioControls;
}

// Make sure to add this to your game initialization code
function initGame(socket, gameId, username) {
    // ... existing game initialization code ...
    
    // Add audio controls to the game UI
    const gameContainer = document.getElementById('game-container');
    const audioControls = createAudioControls(socket, gameId, username);
    gameContainer.appendChild(audioControls);
}

// Clean up function for when the game ends
function endGame() {
    // ... existing end game code ...
    
    // Clean up audio
    if (audioEnabled) {
        toggleAudio(socket, gameId, username);
    }
}