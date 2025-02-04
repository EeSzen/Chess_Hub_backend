const express = require("express");
const router = express.Router();

const {
  getLeaderboards,
  getLeaderboard,
  updateRating,
} = require("../controller/leaderboard");

// GET leaderboards
router.get("/", async (req, res) => {
  try {
    const leaderboards = await getLeaderboards();
    res.status(200).send(leaderboards);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// GET one leaderboard
router.get("/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    const user = await getLeaderboard(_id);
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// UPDATE ratings
router.put("/update", async (req, res) => {
  try {
    const userEmail = req.body.userEmail;
    const opponentEmail = req.body.opponentEmail;
    const result = req.body.result;

    if (!userEmail || !opponentEmail || !result) {
      return res.status(400).send({ error: "Missing required fields." });
    }

    const updatedRatings = await updateRating(userEmail, opponentEmail, result);

    console.log("Updated Ratings:", updatedRatings);

    res.status(200).send(updatedRatings);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

module.exports = router;
