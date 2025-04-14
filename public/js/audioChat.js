let peers = {};
let localStream = null;
let myPeerId = null;

// Initialize audio chat when a game is joined
function initAudioChat(gameId, username) {
  // Get user's audio
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      localStream = stream;
      myPeerId = socket.id;
      
      // Notify others that you've joined the audio chat
      socket.emit('request-audio-connect', { gameId, username });
      
      // Listen for new users joining
      socket.on('user-joined-audio', (data) => {
        connectToNewUser(data.userId, data.username, stream, gameId);
      });
      
      // Handle incoming signals
      socket.on('audio-signal', (data) => {
        handleSignal(data, stream, gameId, username);
      });
    })
    .catch(err => {
      console.error('Failed to get local stream', err);
      alert('Could not access microphone. Please check your permissions.');
    });
}

function connectToNewUser(userId, username, stream, gameId) {
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: stream
  });
  
  peer.on('signal', signal => {
    socket.emit('audio-signal', {
      signal,
      to: userId,
      from: myPeerId,
      gameId,
      username
    });
  });
  
  peer.on('stream', remoteStream => {
    // Create audio element for this peer
    addAudioElement(userId, remoteStream, username);
  });
  
  peers[userId] = peer;
}

function handleSignal(data, stream, gameId, myUsername) {
  // If this is a new peer, create one
  if (!peers[data.from]) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream
    });
    
    peer.on('signal', signal => {
      socket.emit('audio-signal', {
        signal,
        to: data.from,
        from: myPeerId,
        gameId,
        username: myUsername
      });
    });
    
    peer.on('stream', remoteStream => {
      addAudioElement(data.from, remoteStream, data.username);
    });
    
    peer.signal(data.signal);
    peers[data.from] = peer;
  } else {
    // Existing peer, just signal
    peers[data.from].signal(data.signal);
  }
}

function addAudioElement(userId, stream, username) {
  const audioContainer = document.getElementById('audio-chat-container');
  
  // Check if audio element already exists
  if (document.getElementById(`audio-${userId}`)) {
    return;
  }
  
  const audioEl = document.createElement('audio');
  audioEl.id = `audio-${userId}`;
  audioEl.srcObject = stream;
  audioEl.autoplay = true;
  
  const userLabel = document.createElement('div');
  userLabel.className = 'audio-user-label';
  userLabel.textContent = username || 'Unknown player';
  
  const userContainer = document.createElement('div');
  userContainer.className = 'audio-user-container';
  userContainer.appendChild(audioEl);
  userContainer.appendChild(userLabel);
  
  audioContainer.appendChild(userContainer);
}

function leaveAudioChat() {
  // Stop all peer connections
  Object.values(peers).forEach(peer => peer.destroy());
  peers = {};
  
  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  // Clear audio elements
  const audioContainer = document.getElementById('audio-chat-container');
  if (audioContainer) {
    audioContainer.innerHTML = '';
  }
}
