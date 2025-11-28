// WhatsApp-Style Chat System for Keno
(function() {
  let chatMessages = [];
  const MAX_MESSAGES = 100;
  
  // Initialize the chat system
  function initChat(gameId, username) {
    if (!window.gameSocket) {
      console.error('Socket not available for chat system');
      return null;
    }
    
    const socket = window.gameSocket;
    
    // Set up event listeners for sending messages
    setupChatEventListeners(gameId, username, socket);
    
    // Listen for incoming messages
    socket.on('chat-message', (message) => {
      addMessageToChat(message);
    });
    
    // Listen for player join/leave events to update participant count
    socket.on('playerJoined', (data) => {
      updateParticipantsCount(data.players.length);
      addSystemMessage(`${data.players[data.players.length - 1]} joined the game`);
    });
    
    socket.on('playerLeft', (data) => {
      updateParticipantsCount(data.players.length);
      addSystemMessage(`A player left the game`);
    });
    
    // Initialize participants count
    updateParticipantsCount(1); // Start with 1 (current user)
    
    console.log('WhatsApp-style chat system initialized for game:', gameId, 'user:', username);
    
    // Return cleanup function
    return function cleanup() {
      socket.off('chat-message');
      socket.off('playerJoined');
      socket.off('playerLeft');
      chatMessages = [];
    };
  }
  
  // Set up event listeners for the chat
  function setupChatEventListeners(gameId, username, socket) {
    const chatInput = document.getElementById('chat-input-whatsapp');
    const sendButton = document.getElementById('chat-send-whatsapp');
    
    if (!chatInput || !sendButton) {
      console.error('WhatsApp chat input elements not found');
      return;
    }
    
    // Send message on button click
    sendButton.addEventListener('click', () => {
      sendChatMessage(chatInput.value, gameId, username, socket);
      chatInput.value = '';
    });
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendChatMessage(chatInput.value, gameId, username, socket);
        chatInput.value = '';
      }
    });
    
    // Focus input on game screen load
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            if (gameScreen.style.display !== 'none') {
              chatInput.focus();
              observer.disconnect();
            }
          }
        });
      });
      observer.observe(gameScreen, { attributes: true });
    }
    
    console.log('WhatsApp chat event listeners set up');
  }
  
  // Send a chat message
  function sendChatMessage(message, gameId, username, socket) {
    if (!message.trim()) return;
    
    const messageData = {
      gameId: gameId,
      sender: username,
      text: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Emit message to server
    socket.emit('send-chat', messageData);
    
    console.log('Sending chat message:', messageData);
    
    // Add message to local chat (optimistic UI update)
    addMessageToChat(messageData, true); // Mark as own message
  }
  
  // Update participants count in chat header
  function updateParticipantsCount(count) {
    const participantsElement = document.getElementById('chat-players-count');
    if (participantsElement) {
      participantsElement.textContent = `${count} player${count !== 1 ? 's' : ''}`;
    }
  }
  
  // Add system message
  function addSystemMessage(text) {
    const messageData = {
      gameId: 'system',
      sender: 'System',
      text: text,
      timestamp: new Date().toISOString(),
      isSystem: true
    };
    
    addMessageToChat(messageData);
  }
  
  // Add a message to the chat display
  function addMessageToChat(message, isOwnMessage = false) {
    // Add to messages array
    chatMessages.push(message);
    
    // Trim array if it exceeds max length
    if (chatMessages.length > MAX_MESSAGES) {
      chatMessages.shift();
    }
    
    // Get messages container
    const messagesContainer = document.getElementById('chat-messages-whatsapp');
    if (!messagesContainer) {
      console.error('WhatsApp chat messages container not found');
      return;
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message-whatsapp ${isOwnMessage || message.sender === getCurrentUsername() ? 'own' : ''}`;
    
    // Create message bubble
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'message-bubble';
    
    // Add sender info (only for other people's messages)
    if (!isOwnMessage && !message.isSystem && message.sender !== getCurrentUsername()) {
      const senderElement = document.createElement('div');
      senderElement.className = 'message-sender';
      senderElement.textContent = message.sender;
      bubbleElement.appendChild(senderElement);
    }
    
    // Add message text
    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    textElement.textContent = message.text;
    bubbleElement.appendChild(textElement);
    
    // Add timestamp
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = formatTime(message.timestamp);
    bubbleElement.appendChild(timeElement);
    
    messageElement.appendChild(bubbleElement);
    
    // Add special styling for system messages
    if (message.isSystem) {
      messageElement.style.maxWidth = '100%';
      bubbleElement.style.backgroundColor = '#e8f5e8';
      bubbleElement.style.textAlign = 'center';
      bubbleElement.style.fontStyle = 'italic';
      bubbleElement.style.border = '1px solid #4CAF50';
    }
    
    // Add to container
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log('Message added to WhatsApp chat:', message.text);
  }
  
  // Get current username (helper function)
  function getCurrentUsername() {
    const usernameInput = document.getElementById('username');
    return usernameInput ? usernameInput.value : 'Unknown User';
  }
  
  // Format timestamp for display
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // Add welcome message when chat initializes
  function addWelcomeMessage() {
    setTimeout(() => {
      addSystemMessage('Welcome to Keno! Chat with other players here.');
    }, 1000);
  }
  
  // Export functions
  window.chatSystem = {
    init: initChat,
    sendMessage: sendChatMessage,
    addWelcomeMessage: addWelcomeMessage
  };
  
  console.log('WhatsApp-style chat system loaded');
})();

console.log('WhatsApp-style chat system loaded');