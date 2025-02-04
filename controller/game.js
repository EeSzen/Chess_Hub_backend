const Game = require("../models/game");

// save game data
const saveGame = async (moves, winner, players, date) => {
  // Check that all required fields are present
  if (!moves || !winner || !players || !date) {
    throw new Error("Missing required fields: moves, winner, players, date.");
  }

  const newGame = new Game({
    moves,
    winner,
    players,
    date,
  });

  await newGame.save();

  return newGame;
};

// get all game data
const getGames = async () => {
  const filter = {};
  const history = await Game.find(filter).sort({ _id: -1 });
  return history;
};

// get one game
const getGame = async (_id) => {
  const item = await Game.findById(_id);
  return item;
};

// delete the game by _id
const deleteGame = async (_id) => {
  return await Game.findByIdAndDelete(_id);
};

module.exports = { saveGame, getGames, getGame, deleteGame };
