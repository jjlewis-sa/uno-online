// Only initialize if not already done
(function() {
  // Text Chat System for UNO Online
  let chatMessages = [];
  const MAX_MESSAGES = 100; // Maximum number of messages to store

  // Initialize the chat system
  function initChat(gameId, username) {
    // Make sure we have access to the socket
    if (!window.gameSocket) {
      console.error('Socket not available for chat system');
      return null;
    }
    
    const socket = window.gameSocket;
    
    // Create chat UI if it doesn't exist
    createChatUI();
    
    // Set up event listeners for sending messages
    setupChatEventListeners(gameId, username, socket);
    
    // Listen for incoming messages
    socket.on('chat-message', (message) => {
      addMessageToChat(message);
    });
    
    console.log('Chat system initialized for game:', gameId, 'user:', username);
    
    // Return cleanup function
    return function cleanup() {
      socket.off('chat-message');
      chatMessages = [];
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.remove();
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
    
    // Make it visible by default for testing
    chatContainer.classList.add('expanded');
    
    // Style it directly for visibility testing
    chatContainer.style.position = 'fixed';
    chatContainer.style.bottom = '0';
    chatContainer.style.right = '20px';
    chatContainer.style.width = '300px';
    chatContainer.style.height = '400px';
    chatContainer.style.backgroundColor = '#fff';
    chatContainer.style.border = '1px solid #ccc';
    chatContainer.style.borderRadius = '8px 8px 0 0';
    chatContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    chatContainer.style.zIndex = '1000';
    
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
    sendButton.textContent = 'Send';
    
    inputContainer.appendChild(chatInput);
    inputContainer.appendChild(sendButton);
    
    // Assemble chat container
    chatContainer.appendChild(chatHeader);
    chatContainer.appendChild(messagesContainer);
    chatContainer.appendChild(inputContainer);
    
    // Add to document body
    document.body.appendChild(chatContainer);
    
    console.log('Chat UI created and appended to body');
    
    // Add a test message to verify it's working
    const messagesContainer2 = document.getElementById('chat-messages');
    if (messagesContainer2) {
      const testMessage = document.createElement('div');
      testMessage.className = 'chat-message';
      testMessage.textContent = 'Chat system initialized successfully!';
      testMessage.style.padding = '8px';
      testMessage.style.margin = '5px 0';
      testMessage.style.backgroundColor = '#e9e9e9';
      testMessage.style.borderRadius = '4px';
      messagesContainer2.appendChild(testMessage);
    }
  }
  // Set up event listeners for the chat
  function setupChatEventListeners(gameId, username, socket) {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send');
    
    if (!chatInput || !sendButton) {
      console.error('Chat input elements not found');
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
        sendChatMessage(chatInput.value, gameId, username, socket);
        chatInput.value = '';
      }
    });
    
    console.log('Chat event listeners set up');
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
    addMessageToChat(messageData);
  }

  // Add a message to the chat display
  function addMessageToChat(message) {
    // Add to messages array
    chatMessages.push(message);
    
    // Trim array if it exceeds max length
    if (chatMessages.length > MAX_MESSAGES) {
      chatMessages.shift();
    }
    
    // Get messages container
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) {
      console.error('Chat messages container not found');
      return;
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // Add sender info
    const senderElement = document.createElement('span');
    senderElement.className = 'chat-sender';
    senderElement.textContent = message.sender + ': ';
    
    // Add message text
    const textElement = document.createElement('span');
    textElement.className = 'chat-text';
    textElement.textContent = message.text;
    
    // Assemble message
    messageElement.appendChild(senderElement);
    messageElement.appendChild(textElement);
    
    // Add to container
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log('Message added to chat:', message.text);
  }

  // Export functions
  window.chatSystem = {
    init: initChat,
    sendMessage: sendChatMessage
  };

  console.log('Chat system loaded');
})();
console.log('Chat system loaded');