// Text Chat System for UNO Online
let chatMessages = [];
const MAX_MESSAGES = 100; // Maximum number of messages to store

// Initialize the chat system
function initChat(gameId, username) {
  // Create chat UI if it doesn't exist
  createChatUI();
  
  // Set up event listeners for sending messages
  setupChatEventListeners(gameId, username);
  
  // Listen for incoming messages
  socket.on('chat-message', (message) => {
    addMessageToChat(message);
  });
  
  // Return cleanup function
  return function cleanup() {
    socket.off('chat-message');
    chatMessages = [];
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.classList.remove('expanded');
    }
  };
}

// Create the chat UI
function createChatUI() {
  // Check if chat container already exists
  if (document.getElementById('chat-container')) {
    return;
  }
  
  // Create chat container
  const chatContainer = document.createElement('div');
  chatContainer.id = 'chat-container';
  chatContainer.className = 'chat-container';
  
  // Create chat header
  const chatHeader = document.createElement('div');
  chatHeader.className = 'chat-header';
  
  const chatTitle = document.createElement('div');
  chatTitle.className = 'chat-title';
  chatTitle.textContent = 'Game Chat';
  
  const chatToggle = document.createElement('button');
  chatToggle.className = 'chat-toggle';
  chatToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
  chatToggle.addEventListener('click', () => {
    chatContainer.classList.toggle('expanded');
    chatToggle.innerHTML = chatContainer.classList.contains('expanded') 
      ? '<i class="fas fa-chevron-up"></i>' 
      : '<i class="fas fa-chevron-down"></i>';
    
    // Scroll to bottom when expanded
    if (chatContainer.classList.contains('expanded')) {
      const messagesContainer = document.getElementById('chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  });
  
  chatHeader.appendChild(chatTitle);
  chatHeader.appendChild(chatToggle);
  
  // Create messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'chat-messages';
  messagesContainer.className = 'chat-messages';
  
  // Create input area
  const inputContainer = document.createElement('div');
  inputContainer.className = 'chat-input-container';
  
  const chatInput = document.createElement('input');
  chatInput.id = 'chat-input';
  chatInput.className = 'chat-input';
  chatInput.type = 'text';
  chatInput.placeholder = 'Type a message...';
  
  const sendButton = document.createElement('button');
  sendButton.id = 'chat-send';
  sendButton.className = 'chat-send';
  sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
  
  inputContainer.appendChild(chatInput);
  inputContainer.appendChild(sendButton);
  
  // Assemble chat container
  chatContainer.appendChild(chatHeader);
  chatContainer.appendChild(messagesContainer);
  chatContainer.appendChild(inputContainer);
  
  // Add to game screen
  const gameScreen = document.getElementById('game-screen');
  if (gameScreen) {
    gameScreen.appendChild(chatContainer);
  } else {
    document.body.appendChild(chatContainer);
  }
  
  // Add notification badge
  const notificationBadge = document.createElement('div');
  notificationBadge.id = 'chat-notification';
  notificationBadge.className = 'chat-notification';
  notificationBadge.style.display = 'none';
  chatHeader.appendChild(notificationBadge);
}

// Set up event listeners for the chat
function setupChatEventListeners(gameId, username) {
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('chat-send');
  
  // Send message on button click
  sendButton.addEventListener('click', () => {
    sendChatMessage(chatInput.value, gameId, username);
    chatInput.value = '';
  });
  
  // Send message on Enter key
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendChatMessage(chatInput.value, gameId, username);
      chatInput.value = '';
    }
  });
  
  // Clear notification when chat is expanded
  const chatContainer = document.getElementById('chat-container');
  const chatToggle = document.querySelector('.chat-toggle');
  
  chatToggle.addEventListener('click', () => {
    if (chatContainer.classList.contains('expanded')) {
      const notificationBadge = document.getElementById('chat-notification');
      notificationBadge.style.display = 'none';
      notificationBadge.textContent = '';
    }
  });
}

// Send a chat message
function sendChatMessage(text, gameId, username) {
  text = text.trim();
  if (!text) return;
  
  const message = {
    gameId: gameId,
    sender: username,
    text: text,
    timestamp: new Date().toISOString()
  };
  
  // Emit message to server
  socket.emit('send-chat-message', message);
  
  // Add message to local chat (for immediate display)
  addMessageToChat(message);
}

// Add a message to the chat
function addMessageToChat(message) {
  // Add to messages array (with limit)
  chatMessages.push(message);
  if (chatMessages.length > MAX_MESSAGES) {
    chatMessages.shift();
  }
  
  // Create message element
  const messagesContainer = document.getElementById('chat-messages');
  const messageElement = createMessageElement(message);
  messagesContainer.appendChild(messageElement);
  
  // Scroll to bottom if chat is expanded
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer.classList.contains('expanded')) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } else {
    // Show notification if chat is collapsed
    const notificationBadge = document.getElementById('chat-notification');
    const currentCount = parseInt(notificationBadge.textContent) || 0;
    notificationBadge.textContent = currentCount + 1;
    notificationBadge.style.display = 'block';
  }
  
  // Play notification sound
  playNotificationSound();
}

// Create a message element
function createMessageElement(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message';
  
  // Check if this is a system message
  const isSystem = message.sender === 'System';
  if (isSystem) {
    messageElement.classList.add('system-message');
  }
  
  // Check if this is from the current user
  const isCurrentUser = message.sender === myUsername;
  if (isCurrentUser) {
    messageElement.classList.add('my-message');
  }
  
  // Create message content
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  if (!isSystem) {
    // Add sender name
    const senderElement = document.createElement('div');
    senderElement.className = 'message-sender';
    senderElement.textContent = message.sender;
    messageContent.appendChild(senderElement);
  }
  
  // Add message text
  const textElement = document.createElement('div');
  textElement.className = 'message-text';
  textElement.textContent = message.text;
  messageContent.appendChild(textElement);
  
  // Add timestamp
  const timestampElement = document.createElement('div');
  timestampElement.className = 'message-timestamp';
  timestampElement.textContent = formatTimestamp(message.timestamp);
  messageContent.appendChild(timestampElement);
  
  messageElement.appendChild(messageContent);
  return messageElement;
}

// Format timestamp for display
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Play notification sound
function playNotificationSound() {
  // Create audio element if it doesn't exist
  let notificationSound = document.getElementById('notification-sound');
  if (!notificationSound) {
    notificationSound = document.createElement('audio');
    notificationSound.id = 'notification-sound';
    notificationSound.src = 'sounds/notification.mp3'; // Make sure this file exists
    notificationSound.preload = 'auto';
    document.body.appendChild(notificationSound);
  }
  
  // Play sound
  notificationSound.currentTime = 0;
  notificationSound.play().catch(err => console.log('Could not play notification sound', err));
}

// Add a system message
function addSystemMessage(gameId, text) {
  const message = {
    gameId: gameId,
    sender: 'System',
    text: text,
    timestamp: new Date().toISOString()
  };
  
  addMessageToChat(message);
}