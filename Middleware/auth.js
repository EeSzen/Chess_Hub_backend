// const jwt = require("jsonwebtoken");
// const { getUserByEmail } = require("../controller/user");

// // to check if the user is a valid user
// const isValidUser = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     // verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     // get the user data by email
//     const user = await getUserByEmail(decoded.email);

//     // if user exists
//     if (user) {
//       req.user = user;
//       // trigger the next function
//       next();
//     } else {
//       res.status(403).send({ error: "YOU SHALL NOT PASSSSS!!!!!" });
//     }
//   } catch (error) {
//     res.status(400).send({
//       error: "YOU ARE NOT WORTHY!!!!!",
//     });
//   }
// };

// // to check if the user is an admin
// const isAdmin = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     // verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     // get the user data by email
//     const user = await getUserByEmail(decoded.email);

//     // if user exists and is an admin
//     if (user && user.role === "admin") {
//       // add user data into request
//       req.user = user;
//       // trigger the next function
//       next();
//     } else {
//       res.status(403).send({ error: "YOU SHALL NOT PASSSSS!!!!!" });
//     }
//   } catch (error) {
//     res.status(400).send({
//       error: "WHYYY!!!!!",
//     });
//   }
// };

// module.exports = {
//   isValidUser,
//   isAdmin,
// };

const jwt = require("jsonwebtoken");
const { getUserByEmail } = require("../controller/user");

// Middleware to check if user is valid
const isValidUser = async (req, res, next) => {
  try {
    console.log("Authorization Header:", req.headers.authorization);

    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = req.headers.authorization?.split(" ")[1];
    console.log("Extracted Token:", token);

    // Check if the token looks like a JWT
    if (token.split(".").length !== 3) {
      return res.status(401).json({ error: "Malformed token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return res.status(403).json({ error: "Invalid token: user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user data from DB
    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return res.status(403).json({ error: "Invalid token: user not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    res.status(400).json({ error: "Authentication failed" });
  }
};

module.exports = {
  isValidUser,
  isAdmin,
};
