# Keno Lobby Display - Big Screen TV Guide

## Overview
The Keno Lobby Display is a dedicated interface designed for big screen TVs that shows the keno board with live draw results, game information, and scrolling chat messages.

## Features
- **Large Keno Board**: Shows all 80 numbers with drawn numbers highlighted in red
- **Game ID Display**: Prominently shows the current game ID for easy viewing
- **Live Chat**: Scrolling chat messages at the bottom of the screen
- **Game Status**: Shows current game phase (betting, drawing, results)
- **Player Count**: Displays current number of players and bets placed
- **Timer**: Shows countdown to next draw
- **Responsive Design**: Works on different screen sizes

## How to Use

### Method 1: From Game Lobby
1. Create or join a keno game as usual
2. In the lobby screen, click the **"📺 Open Lobby Display"** button
3. A new window will open with the lobby display
4. Move this window to your big screen TV or projector

### Method 2: Direct URL
1. Navigate to: `http://your-server/lobby-display.html?gameId=YOURGAMEID`
2. Replace `YOURGAMEID` with the actual game ID (e.g., `ABC123`)
3. The display will automatically connect to the specified game

## Display Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🎱 MULTIPLAYER KENO                    GAME ID: ABC123     │
│                                               💰 Place Bets │
│  ┌─────────────────┐  👥 Players                        │
│  │ [1][2][3]...   │  • John                            │
│  │ [11][12][13]...│  • Sarah                           │
│  │ ...             │  • Mike                            │
│  │ [71][72][73]...│                                   │
│  └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
│ Live Chat: John: Good luck everyone!    Sarah: Let's go!  │
└─────────────────────────────────────────────────────────────┘
```

## Technical Details

### Real-time Updates
The lobby display connects to the same WebSocket server as the regular game client and receives real-time updates for:
- Game state changes (betting → drawing → results)
- Drawn numbers with animations
- Player join/leave events
- Chat messages
- Timer countdown

### Visual Effects
- **Drawn Numbers**: Red background with glow effect
- **Winning Animation**: Green pulsing effect on drawn numbers
- **Smooth Animations**: Numbers appear with staggered timing
- **Responsive Chat**: Auto-scrolls to show latest messages

### Auto-Refresh
The display automatically refreshes every 30 minutes to prevent memory leaks and ensure stable performance.

## Setup Instructions for Events/Parties

### For Event Organizers:
1. **Open Lobby Display**: Use the "Open Lobby Display" button from the game lobby
2. **Full Screen Mode**: Press F11 in most browsers for full-screen mode
3. **TV Connection**: 
   - Connect laptop/computer to TV via HDMI
   - Extend display to TV (Windows: Win+P, Mac: System Preferences > Displays)
   - Drag the lobby display window to the TV screen
4. **Audio**: Consider connecting external speakers for better audio during chat interactions

### For Players:
- The lobby display doesn't interfere with regular gameplay
- Players can still join using the regular game interface on their phones/tablets
- Chat messages from the lobby display appear in the regular game chat
- Game ID is clearly displayed for easy sharing

## Browser Compatibility
- Chrome/Edge: Full support with best performance
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design adapts to smaller screens

## Troubleshooting

### Display Not Connecting
- Check that the game ID is correct (6 characters)
- Ensure the main game is still active
- Refresh the lobby display page
- Check internet connection

### Numbers Not Appearing
- Numbers appear during the drawing phase
- Wait for the "🎱 Drawing Numbers" status
- Numbers animate in sequence over several seconds

### Chat Not Working
- Chat requires players to be connected to the same game
- Check that the game has active players
- Messages may take a few seconds to appear

## Tips for Best Experience
1. **Use a computer/laptop** rather than mobile device for the display
2. **Full-screen mode** for immersive experience
3. **Good lighting** around the TV for visibility
4. **Stable internet connection** for smooth real-time updates
5. **Close unnecessary tabs** to improve performance

## File Structure
```
public/
├── lobby-display.html     # Main lobby display page
├── index.html             # Regular game interface (updated with lobby link)
├── js/game.js            # Regular game logic
└── styles.css            # Regular game styles (lobby uses inline styles)
```

The lobby display is completely self-contained with all styling and functionality included in the single HTML file.