# Multiplayer Keno Game

Welcome to the Multiplayer Keno Game! This project brings the classic lottery-style game Keno to the digital world, allowing players to enjoy the game online with friends and family.

## Features

- Play with friends or random opponents
- Create private rooms for exclusive games
- **🏆 Big Screen TV Lobby Display** - Dedicated display for events and parties
- Chat functionality during gameplay
- Live number drawing every 3 minutes
- Betting system with multiple chip denominations
- Real-time results and payout calculations
- Responsive design for mobile and desktop

## Getting Started

To get started with the Multiplayer Keno Game, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/multiplayer-keno.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd multiplayer-keno
   ```

3. **Install dependencies and start server:**

   **For Windows users (easiest):**
   - Simply double-click `start.bat` or run it from Command Prompt
   - The script will check for Node.js, install dependencies, and start the server
   
   **For manual setup:**
   Make sure you have Node.js installed, then run:

   ```bash
   npm install
   ```

4. **Start the development server:**

   ```bash
   npm start
   ```

5. **Open your browser and go to:**

   ```
   http://localhost:3000
   ```

## How to Play

1. **Join a Game:**
   - Create a new game or join an existing game using a game ID
   
2. **Select Your Numbers:**
   - Choose 1-15 numbers from the 1-80 number grid
   - Numbers are selected by clicking on the grid

3. **Place Your Bet:**
   - Select your bet amount using the betting chips ($1, $5, $10, $25, $50, $100)
   - Click "Place Bet" to confirm your selection

4. **Watch the Drawing:**
   - Every 3 minutes, 20 numbers are drawn automatically
   - Watch the live animation as numbers are revealed

5. **Check Your Results:**
   - See how many of your numbers matched the drawn numbers
   - View your winnings based on the payout table

## 🏆 Big Screen TV Lobby Display

For events, parties, or gatherings, use the lobby display feature:

1. **Open Lobby Display:**
   - In the game lobby, click "📺 Open Lobby Display"
   - A new window will open optimized for big screens

2. **Connect to TV:**
   - Connect your computer to a TV or projector via HDMI
   - Drag the lobby display window to the TV screen
   - Press F11 for full-screen mode

3. **Display Features:**
   - Large keno board (80 numbers) with drawn numbers highlighted
   - Prominently displayed game ID for easy sharing
   - Live scrolling chat messages
   - Real-time game status and player count
   - Countdown timer to next draw

4. **Direct URL Access:**
   - Navigate to: `http://localhost:3000/lobby-display.html?gameId=YOURGAMEID`
   - Replace `YOURGAMEID` with the actual game ID

For detailed setup instructions, see [LOBBY_DISPLAY_GUIDE.md](LOBBY_DISPLAY_GUIDE.md).

## Payout Table

| Matches | Payout Multiplier |
|---------|------------------|
| 0-3     | 0x               |
| 4       | 2x               |
| 5       | 10x              |
| 6       | 50x              |
| 7       | 150x             |
| 8       | 1,000x           |
| 9       | 5,000x           |
| 10      | 25,000x          |

## Game Rules

- Players can select 1-15 numbers from 1-80
- 20 numbers are drawn every 3 minutes
- Winnings are calculated based on how many of your numbers match the drawn numbers
- Higher payouts for more matches
- All players participate in the same drawing cycles

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the creators of Keno for the inspiration!
- Special thanks to all contributors who help make this project better.

Enjoy playing Multiplayer Keno!
