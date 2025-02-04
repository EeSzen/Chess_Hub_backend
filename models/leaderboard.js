const { Schema, model } = require("mongoose");

const leaderboardSchema = new Schema({
  userEmail: {
    type: String,
    required: true,
    unique: true,
  },
  playerName: {
    type: String,
    required: true,
    // unique: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 1200, // Default Elo rating
  },
  gamesWon: {
    type: Number,
    default: 0,
  },
  gamesLost: {
    type: Number,
    default: 0,
  },
  gamesDrawn: {
    type: Number,
    default: 0,
  },
});

const Leaderboard = model("Leaderboard", leaderboardSchema);
module.exports = Leaderboard;
