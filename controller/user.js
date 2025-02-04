const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Leaderboard = require("../models/leaderboard");

// get user by email
async function getUserByEmail(email) {
  return await User.findOne({ email });
}

function generateJWTtoken(_id, name, email, role) {
  return jwt.sign(
    {
      _id,
      name,
      email,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d", //60 * 60 * 24 * 100000
    }
  );
}

const login = async (email, password) => {
  // check if the email exists in our sytstem or not
  const user = await User.findOne({
    email,
  });
  // if not exists, throw error
  if (!user) {
    throw new Error("Invalid email or password");
  }
  // if exists, compare the password
  const isPasswordMatch = bcrypt.compareSync(password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }

  // Check if the user exists in the leaderboard
  const leaderboardEntry = await Leaderboard.findOne({ userEmail: email });
  if (!leaderboardEntry) {
    const newLeaderboardEntry = new Leaderboard({
      userEmail: email,
      playerName: user.name,
      rating: 1200, // Default rating
    });
    await newLeaderboardEntry.save();
  }

  // Generate JWT TOKEN
  const token = generateJWTtoken(user._id, user.name, user.email, user.role);

  // password correct, return the user data
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  };
};

const signup = async (name, email, password) => {
  // check if email exist or not
  const emailExists = await User.findOne({
    email,
  });
  // if email exists in the collection
  if (emailExists) {
    throw new Error("Email already exists");
  }

  // create new user
  const newUser = new User({
    name,
    email,
    password: bcrypt.hashSync(password, 10),
  });

  // save the user data
  await newUser.save();

  // Automatically add to leaderboard if there is no existing leaderboard
  const existingLeaderboardEntry = await Leaderboard.findOne({
    userEmail: email,
  });
  if (!existingLeaderboardEntry) {
    const newLeaderboardEntry = new Leaderboard({
      userEmail: email,
      playerName: name,
      rating: 1200, // Default rating
      gamesWon: 0,
      gamesLost: 0,
      gamesDrawn: 0,
    });
    await newLeaderboardEntry.save();
  }

  // Generate JWT TOKEN
  const token = generateJWTtoken(
    newUser._id,
    newUser.name,
    newUser.email,
    newUser.role
  );

  // return the user data
  return {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    token,
  };
};

// Admin page controller

// get all user
const getAllUsers = async () => {
  try {
    const filter = {};
    const users = await User.find(filter).sort({ _id: -1 });
    return users;
  } catch (error) {
    console.error("Error getting the users:", error);
    throw new Error("Error getting the users: " + error.message);
  }
};

// get one User by id
const getOneUser = async (_id) => {
  const user = await User.findById(_id);
  return user;
};

// update one user details
const updateUser = async (_id, name, email, password, role) => {
  // Prepare the update object
  let updateData = { name, email, role };

  // Only hash and update password if a new one is provided
  if (password) {
    updateData.password = bcrypt.hashSync(password, 10); // Hash the password before saving
  }

  // Find the user by ID and update their details
  const updatedUser = await User.findByIdAndUpdate(_id, updateData, {
    new: true,
  });

  return updatedUser;
};

// delete one user by _id
const deleteUser = async (_id) => {
  return await User.findByIdAndDelete(_id);
};

module.exports = {
  login,
  signup,
  getUserByEmail,
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
};
