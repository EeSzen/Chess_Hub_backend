const Leaderboard = require("../models/leaderboard");

// get all leaderboard users
const getLeaderboards = async () => {
  const filter = {};
  const leaderboard = await Leaderboard.find(filter).sort({ rating: -1 });
  return leaderboard;
};

// get one leaderboard by id
const getLeaderboard = async (_id) => {
  const user = await Leaderboard.findById(_id);
  return user;
};

// Function to calculate new rating using a basic ELO formula
const calculateNewRating = (currentRating, opponentRating, result) => {
  const K = 32; // Adjust K-factor as needed

  // Rnew = Rold + K/2 (W – L + ½ [EiDi/C])
  // Expected score using ELO formula
  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));

  let score = 0;
  if (result === "win") score = 1;
  else if (result === "draw") score = 0.5;

  // New rating calculation
  return Math.round(currentRating + K * (score - expectedScore));
};

// update leaderboard users rating
const updateRating = async (userEmail, opponentEmail, result) => {
  const user = await Leaderboard.findOne({ userEmail });
  const opponent = await Leaderboard.findOne({ userEmail: opponentEmail });

  if (!user || !opponent) {
    throw new Error("One or both players not found in leaderboard.");
  }

  const newUserRating = calculateNewRating(
    user.rating,
    opponent.rating,
    result
  );
  const opponentResult =
    result === "win" ? "lose" : result === "lose" ? "win" : "draw";
  const newOpponentRating = calculateNewRating(
    opponent.rating,
    user.rating,
    opponentResult
  );

  // Update user rating & stats
  user.rating = newUserRating;
  if (result === "win") user.gamesWon += 1;
  if (result === "lose") user.gamesLost += 1;
  if (result === "draw") user.gamesDrawn += 1;
  await user.save();

  // Update opponent rating & stats
  opponent.rating = newOpponentRating;
  if (opponentResult === "win") opponent.gamesWon += 1;
  if (opponentResult === "lose") opponent.gamesLost += 1;
  if (opponentResult === "draw") opponent.gamesDrawn += 1;
  await opponent.save();

  return { user, opponent };
};

module.exports = { getLeaderboards, getLeaderboard, updateRating };
