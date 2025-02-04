const express = require("express");
const router = express.Router();

const {
  login,
  signup,
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
} = require("../controller/user");

// login route
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    // login user via login function
    const user = await login(email, password);
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// signup route
router.post("/signup", async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const user = await signup(name, email, password);
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// GET all the users
router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).send(users);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// GET one user
router.get("/users/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    const user = await getOneUser(_id);
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// UPDATE user detail
router.put("/users/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role;

    // Check if the user exists
    const userExists = await getOneUser(_id);
    if (!userExists) {
      return res.status(404).send({
        error: `User with ID ${_id} not found.`,
      });
    }

    const updatedUser = await updateUser(_id, name, email, password, role);
    res.status(200).send(updatedUser);
  } catch (error) {
    res.status(400).send({
      error: error.message,
    });
  }
});

// DELETE one user
router.delete("/users/:_id", async (req, res) => {
  try {
    const _id = req.params._id;
    await deleteUser(_id);
    res.status(200).send({
      message: `User with the id #${_id} has been succesfully deleted =) `,
    });
  } catch (error) {
    res.status(400).send({
      error: "User is not found",
    });
  }
});

module.exports = router;
