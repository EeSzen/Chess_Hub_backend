const { Schema, model } = require("mongoose");

const gameSchema = new Schema({
  moves: [{ player: String, move: String }],
  winner: String,
  date: { type: Date, default: Date.now },
  players: {
    white: String,
    black: String,
  },
});

const Game = model("Game", gameSchema);
module.exports = Game;
