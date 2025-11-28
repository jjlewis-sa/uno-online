# Testing the Keno Lobby Display

## Quick Test Instructions

### 1. Start the Server
```bash
npm start
```

### 2. Open the Main Game
Navigate to: `http://localhost:3000`

### 3. Create a Test Game
1. Enter a username (e.g., "TestPlayer")
2. Click "Create Game"
3. Note the Game ID (6 characters, e.g., "ABC123")

### 4. Open Lobby Display
1. In the lobby screen, click "📺 Open Lobby Display"
2. A new window should open showing the lobby display
3. The display should automatically connect to your game

### 5. Test Features

#### Keno Board
- Should show a 10x8 grid with numbers 1-80
- Numbers should be white/gray initially

#### Game ID Display
- Should prominently show your game ID
- Should match the ID from the main game

#### Players Section
- Should show your username in the players list
- Player count should be "1 player"

#### Chat
- Should be visible at the bottom
- System messages should appear automatically

### 6. Test Game Flow
1. **Betting Phase**: Should show "💰 Place Your Bets"
2. **Drawing Phase**: Numbers should animate red when drawn
3. **Results Phase**: Should show "🎉 Round Complete"

### 7. Test Chat Functionality
1. Send a message in the main game chat
2. The message should appear in the lobby display chat
3. Chat should auto-scroll to show latest messages

## Direct URL Testing

You can also test by navigating directly to:
```
http://localhost:3000/lobby-display.html?gameId=YOURGAMEID
```

Replace `YOURGAMEID` with the actual 6-character game ID.

## Expected Behavior

### Visual Elements
- **Header**: Large title "🎱 MULTIPLAYER KENO"
- **Game ID**: Prominently displayed in green box
- **Keno Grid**: 80 numbers in 10x8 layout
- **Players List**: Right side showing active players
- **Chat**: Bottom section with scrolling messages
- **Status**: Current game phase and timer

### Animations
- **Drawn Numbers**: Red background with glow effect
- **Winning Numbers**: Green pulsing animation
- **Chat Messages**: Slide in from left/right
- **Timer**: Updates every second

### Responsive Design
- Works on desktop, tablet, and mobile
- Full-screen mode available (F11)
- Adapts layout for different screen sizes

## Troubleshooting

### Display Not Connecting
- Check that the game ID is correct
- Ensure the main game is still active
- Try refreshing the lobby display page

### Numbers Not Drawing
- Wait for the drawing phase (every 3 minutes)
- Check that numbers appear with red highlighting
- Look for green pulsing animation on drawn numbers

### Chat Not Working
- Ensure players are active in the main game
- Check that chat messages appear in main game first
- Verify internet connection is stable

### Performance Issues
- Close unnecessary browser tabs
- Ensure stable internet connection
- Auto-refresh occurs every 30 minutes

## File Structure
```
c:/New_Projects/multiplayer_keno/
├── server.js              # Main server (unchanged)
├── public/
│   ├── index.html         # Updated with lobby display button
│   ├── lobby-display.html # New dedicated lobby display
│   └── js/
│       ├── game.js        # Main game logic
│       └── textChat.js    # Chat system
├── README.md              # Updated with lobby display info
└── LOBBY_DISPLAY_GUIDE.md # Detailed setup guide
```

The lobby display is completely self-contained and doesn't interfere with the main game functionality.