const { model, Schema } = require("mongoose");

const openingsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  moves: [{ move: { type: String, required: true } }],
  color: {
    type: String,
    enum: ["black", "white"],
    required: true,
  },
});

const Openings = model("Openings", openingsSchema);
module.exports = Openings;
