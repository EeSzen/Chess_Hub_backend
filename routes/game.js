const express = require("express");
const router = express.Router();

const { saveGame, getGames, getGame, deleteGame } = require("../controller/game");

// POST route to save the game
router.post("/", async (req, res) => {
  try {
    const { moves, winner, players, date } = req.body;
    // console.log("Received Game Data:", JSON.stringify(req.body, null, 2));

    const game = await saveGame(moves, winner, players, date);
    // console.log("Received Game Data:", JSON.stringify(req.body, null, 2));

    res.status(200).json({
      message: "Game saved successfully",
      game,
    });
  } catch (error) {
    // Handle errors if saving the game fails
    res.status(400).json({
      error: error.message,
    });
  }
});

// GET all the history
router.get("/", async (req, res) => {
  try {
    const history = await getGames();
    res.status(200).send(history);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// GET one game history
router.get("/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    const history = await getGame(_id);
    if (history) {
      res.status(200).send(history);
    } else res.status(400).send("Game cannot not Found");
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// DELETE one game history
router.delete("/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    await deleteGame(_id);
    res.status(200).send({
      message: `Game with the id #${_id} has been succesfully deleted =) `,
    });
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

module.exports = router;
