const Openings = require("../models/openings");

// add openings
const addOpening = async (name, moves, color) => {
  // Check that all required fields are present
  if (!name || !moves || !color) {
    throw new Error("Missing required fields: name, moves, color.");
  }

  const newOpening = new Openings({
    name,
    moves,
    color,
  });

  await newOpening.save();

  return newOpening;
};

// get all openings
const getOpenings = async () => {
  const filter = {};
  const openings = await Openings.find(filter).sort({ _id: -1 });
  return openings;
};

// getOne opening
const getOpening = async (_id) => {
  const item = await Openings.findById(_id);
  return item;
};

// update opening
const updateOpening = async (_id, name, moves, color) => {
  const updatedOpening = await Openings.findByIdAndUpdate(
    _id,
    { name, moves, color },
    {
      new: true,
    }
  );
  return updatedOpening;
};

// delete the opening by _id
const deleteOpening = async (_id) => {
  return await Openings.findByIdAndDelete(_id);
};

module.exports = {
  addOpening,
  getOpenings,
  getOpening,
  deleteOpening,
  updateOpening,
};
