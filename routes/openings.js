const express = require("express");
const router = express.Router();

const {
  getOpenings,
  getOpening,
  addOpening,
  updateOpening,
  deleteOpening,
} = require("../controller/openings");

// add opening
router.post("/add", async (req, res) => {
  try {
    const name = req.body.name;
    const moves = req.body.moves;
    const color = req.body.color;

    if (!name || !moves || !color) {
      return res.status(400).send({
        error: "Error: Required opening data is missing!",
      });
    }

    const newOpening = await addOpening(name, moves, color);
    res.status(200).send(newOpening);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// get all
router.get("/", async (req, res) => {
  try {
    const openings = await getOpenings();
    res.status(200).send(openings);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// get one
router.get("/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    const opening = await getOpening(_id);
    res.status(200).send(opening);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// update one
router.put("/edit/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    const name = req.body.name;
    const moves = req.body.moves;
    const color = req.body.color;

    // Check if the opening exists
    const openingExists = await getOpening(_id);
    if (!openingExists) {
      return res.status(400).send({
        error: `Opening with ID ${_id} not found.`,
      });
    }

    const updatedOpening = await updateOpening(_id, name, moves, color);
    res.status(200).send(updatedOpening);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// delete one
router.delete("/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    await deleteOpening(_id);
    res.status(200).send({
      message: `Opening with the ID #${_id} has been succesfully deleted =) `,
    });
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

module.exports = router;
