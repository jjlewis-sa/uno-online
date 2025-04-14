const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// Game state
const games = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Create a new game
  socket.on('createGame', (username) => {
    const gameId = generateGameId();
    games[gameId] = {
      id: gameId,
      players: [{id: socket.id, username, hand: []}],
      deck: createDeck(),
      currentPlayer: 0,
      direction: 1,
      discardPile: []
    };
    
    shuffleDeck(games[gameId].deck);
    socket.join(gameId);
    socket.emit('gameCreated', gameId);
  });
  
  // Join an existing game
  socket.on('joinGame', (data) => {
    const { gameId, username } = data;
    
    if (!games[gameId]) {
      socket.emit('error', 'Game not found');
      return;
    }
    
    games[gameId].players.push({id: socket.id, username, hand: []});
    socket.join(gameId);
    
    io.to(gameId).emit('playerJoined', {
      players: games[gameId].players.map(p => p.username)
    });
  });
  
  // Start the game
  socket.on('startGame', (gameId) => {
    if (!games[gameId]) return;
    
    // Deal 7 cards to each player
    games[gameId].players.forEach(player => {
      for (let i = 0; i < 7; i++) {
        player.hand.push(games[gameId].deck.pop());
      }
    });
    
    // First card in discard pile
    let firstCard = games[gameId].deck.pop();
    // Make sure first card isn't a wild or draw four
    while (firstCard.color === 'wild' || firstCard.value === 'draw four') {
      games[gameId].deck.unshift(firstCard);
      firstCard = games[gameId].deck.pop();
    }
    games[gameId].discardPile.push(firstCard);
    
    // Send game state to all players
    games[gameId].players.forEach(player => {
      io.to(player.id).emit('gameStarted', {
        hand: player.hand,
        currentCard: firstCard,
        currentPlayer: games[gameId].players[0].username
      });
    });
  });
  
  // Play a card
  socket.on('playCard', (data) => {
    const { gameId, cardIndex } = data;
    const game = games[gameId];
    
    if (!game) return;
    
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex !== game.currentPlayer) {
      socket.emit('error', 'Not your turn');
      return;
    }
    
    const card = game.players[playerIndex].hand[cardIndex];
    const topCard = game.discardPile[game.discardPile.length - 1];
    const currentColor = topCard.selectedColor || topCard.color;
    
    // Check if card can be played
    if (
      card.color === 'wild' ||
      card.color === currentColor ||
      card.value === topCard.value
    ) {
      // Additional validation for draw four
      if (card.value === 'draw four') {
        // Check if player has any cards of the current color
        const hasCurrentColor = game.players[playerIndex].hand.some(c =>
          c.color === currentColor && c !== card
        );
        
        if (hasCurrentColor) {
          socket.emit('error', 'You can only play Draw Four if you have no cards of the current color');
          return;
        }
      }
      
      // Remove card from player's hand
      game.players[playerIndex].hand.splice(cardIndex, 1);
      
      // Add card to discard pile
      game.discardPile.push(card);
      
      // If it's a wild card, prompt player to select a color
      if (card.color === 'wild') {
        socket.emit('selectColor');
        return; // Wait for color selection before continuing
      }
      
      // Handle special cards
      handleSpecialCard(game, card);
      
      // Check for win condition
      if (game.players[playerIndex].hand.length === 0) {
        io.to(gameId).emit('gameOver', {
          winner: game.players[playerIndex].username
        });
        return;
      }
      
      // Update game state for all players
      updateGameState(gameId);
    } else {
      socket.emit('error', 'Invalid card');
    }
  });
  
  // Select color
  socket.on('selectColor', (data) => {
    const { gameId, color } = data;
    const game = games[gameId];
    
    if (!game) return;
    
    // Get the last played card
    const lastCard = game.discardPile[game.discardPile.length - 1];
    
    // If it's a wild card, update its color
    if (lastCard.color === 'wild') {
      lastCard.selectedColor = color;
      
      // Handle special card effects after color selection
      handleSpecialCard(game, lastCard);
      
      // Check for win condition
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1 && game.players[playerIndex].hand.length === 0) {
        io.to(gameId).emit('gameOver', {
          winner: game.players[playerIndex].username
        });
        return;
      }
      
      // Update game state for all players
      updateGameState(gameId);
      socket.emit('colorSelected'); // Notify the client that the color selection is complete
    } else {
      socket.emit('error', 'Invalid card selection');
    }
  });
  
  // Draw a card
  socket.on('drawCard', (gameId) => {
    const game = games[gameId];
    
    if (!game) return;
    
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex !== game.currentPlayer) {
      socket.emit('error', 'Not your turn');
      return;
    }
    
    // Draw card
    if (game.deck.length === 0) {
      // Reshuffle discard pile if deck is empty
      const lastCard = game.discardPile.pop();
      game.deck = game.discardPile;
      game.discardPile = [lastCard];
      shuffleDeck(game.deck);
    }
    
    const card = game.deck.pop();
    game.players[playerIndex].hand.push(card);
    
    // Send the card to the player
    socket.emit('cardDrawn', card);
    
    // Move to next player
    game.currentPlayer = (game.currentPlayer + game.direction) % game.players.length;
    if (game.currentPlayer < 0) game.currentPlayer += game.players.length;
    
    updateGameState(gameId);
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
        
        if (game.players.length === 0) {
          delete games[gameId];
        } else {
          // Adjust current player if needed
          if (playerIndex < game.currentPlayer) {
            game.currentPlayer--;
          } else if (playerIndex === game.currentPlayer) {
            game.currentPlayer %= game.players.length;
          }
          
          io.to(gameId).emit('playerLeft', {
            players: game.players.map(p => p.username)
          });
        }
      }
    }
  });

  // Audio chat signaling
  socket.on('audio-signal', (data) => {
    // Forward the signal to the specific recipient or room
    if (data.gameId) {
      socket.to(data.gameId).emit('audio-signal', {
        signal: data.signal,
        from: socket.id,
        username: data.username
      });
    }
  });

  socket.on('request-audio-connect', (data) => {
    socket.to(data.gameId).emit('user-joined-audio', {
      userId: socket.id,
      username: data.username
    });
  });
});

// Helper functions
function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createDeck() {
  const colors = ['red', 'green', 'blue', 'yellow'];
  const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw two'];
  const deck = [];
  
  for (let color of colors) {
    for (let value of values) {
      deck.push({ color, value });
      if (value !== '0') {
        deck.push({ color, value });
      }
    }
  }
  
  // Add wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'wild', value: 'wild' });
    deck.push({ color: 'wild', value: 'draw four' });
  }
  
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function handleSpecialCard(game, card) {
  switch (card.value) {
    case 'skip':
      game.currentPlayer = (game.currentPlayer + game.direction) % game.players.length;
      if (game.currentPlayer < 0) game.currentPlayer += game.players.length;
      break;
    case 'reverse':
      game.direction *= -1;
      if (game.players.length === 2) {
        // For 2 players, reverse acts like skip
        game.currentPlayer = (game.currentPlayer + game.direction) % game.players.length;
        if (game.currentPlayer < 0) game.currentPlayer += game.players.length;
      }
      break;
    case 'draw two':
      let nextPlayerIndex = (game.currentPlayer + game.direction) % game.players.length;
      if (nextPlayerIndex < 0) nextPlayerIndex += game.players.length;
      
      // Draw 2 cards
      for (let i = 0; i < 2; i++) {
        if (game.deck.length === 0) {
          const lastCard = game.discardPile.pop();
          game.deck = game.discardPile;
          game.discardPile = [lastCard];
          shuffleDeck(game.deck);
        }
        game.players[nextPlayerIndex].hand.push(game.deck.pop());
      }
      
      // Skip the next player
      game.currentPlayer = (nextPlayerIndex + game.direction) % game.players.length;
      if (game.currentPlayer < 0) game.currentPlayer += game.players.length;
      break;
    case 'draw four':
      let nextPlayerIdx = (game.currentPlayer + game.direction) % game.players.length;
      if (nextPlayerIdx < 0) nextPlayerIdx += game.players.length;
      
      // Check if we have enough cards in the deck, if not reshuffle
      if (game.deck.length < 4) {
        const lastCard = game.discardPile.pop(); // Save the top card (which is the draw four)
        game.deck = [...game.deck, ...game.discardPile]; // Combine remaining deck with discard pile
        game.discardPile = [lastCard]; // Reset discard pile with just the draw four
        shuffleDeck(game.deck);
      }
      
      // Draw 4 cards
      for (let i = 0; i < 4; i++) {
        game.players[nextPlayerIdx].hand.push(game.deck.pop());
      }
      
      // Skip the next player
      game.currentPlayer = (nextPlayerIdx + game.direction) % game.players.length;
      if (game.currentPlayer < 0) game.currentPlayer += game.players.length;
      break;
    default:
      // Move to next player
      game.currentPlayer = (game.currentPlayer + game.direction) % game.players.length;
      if (game.currentPlayer < 0) game.currentPlayer += game.players.length;
  }
}

function updateGameState(gameId) {
  const game = games[gameId];
  
  const topCard = game.discardPile[game.discardPile.length - 1];
  const currentColor = topCard.selectedColor || topCard.color;
  
  game.players.forEach(player => {
    io.to(player.id).emit('updateGame', {
      hand: player.hand,
      currentCard: topCard,
      currentColor: currentColor,
      currentPlayer: game.players[game.currentPlayer].username,
      players: game.players.map(p => ({
        username: p.username,
        cardCount: p.hand.length
      }))
    });
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the serverless function
module.exports.handler = serverless(app);