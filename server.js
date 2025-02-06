require("dotenv").config();
// import express
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
/////////////////////////////////////
const { Server } = require("socket.io");
const { v4: uuidV4 } = require("uuid");
const http = require("http"); // Import HTTP module
const Leaderboard = require("./models/leaderboard");
// create the express app
/////////////////////////////////////
const app = express();

const server = http.createServer(app);

// middleware to handle JSON request
app.use(express.json());

// setup cors policy
app.use(cors());

// connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/chesshub")
  .then(() => {
    // if mongodb is successfully connected
    console.log("MongoDB is connected");
  })
  .catch((error) => {
    console.log(error);
  });

// upgrade http server to websocket server
const io = new Server(server, {
  cors: "*", // allow connection from any origin
});

// io.connection
const rooms = new Map();

// io.connection
io.on("connection", (socket) => {
  // socket refers to the client socket that just got connected.
  // each socket is assigned an id
  console.log(socket.id, "connected");

  socket.on("username", (username) => {
    console.log("username:", username);
    socket.data.username = username;
  });

  // Handle user authentication with JWT token
  socket.on("authenticate", (token, callback) => {
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your JWT_SECRET from .env
      const userId = decoded._id; // Get user ID from the token

      // Find the user by ID (Optional: you can fetch the user data if needed)
      User.findById(userId)
        .then((user) => {
          if (!user) {
            return callback({ error: "User not found" });
          }

          // Store username and other details in socket data
          socket.data.username = user.name;
          socket.data.userId = user._id;
          console.log(`User ${user.name} authenticated successfully`);

          // Respond back with the username and a success message
          callback({ success: true, username: user.name });
        })
        .catch((error) => {
          callback({ error: "Error retrieving user data" });
        });
    } catch (error) {
      callback({ error: "Invalid or expired token" });
    }
  });

  // create room
  socket.on("createRoom", async (data, callback) => {
    // callback here refers to the callback function from the client passed as data
    const roomId = uuidV4(); // <- 1 create a new uuid
    await socket.join(roomId); // <- 2 make creating user join the room

    // Check if username is present
    if (!data.username) {
      callback({ error: "Username is required" });
      return;
    }

    // set roomId as a key and roomData including players as value in the map
    rooms.set(roomId, {
      // <- 3
      roomId,
      players: [{ id: socket.id, username: data.username, email: data.email }],
    });
    // returns Map(1){'2b5b51a9-707b-42d6-9da8-dc19f863c0d0' => [{id: 'socketid', username: 'username1'}]}

    callback({
      roomId,
      players: [{ id: socket.id, username: data.username, email: data.email }],
    }); // <- 4 respond with roomId to client by calling the callback function from the client
  });

  // join room
  socket.on("joinRoom", async (args, callback) => {
    // check if room exists and has a player waiting
    const room = rooms.get(args.roomId);
    let error, message;

    if (!room) {
      error = true;
      message = "room does not exist";
    } else if (room.players.length >= 2) {
      // if room is full
      error = true;
      message = "room is full";
    }

    if (error) {
      // if there's an error, check if the client passed a callback,
      if (callback) {
        // if user passed a callback, call it with an error payload
        callback({
          error,
          message,
        });
      }
      return; // exit
    }

    await socket.join(args.roomId); // make the joining client join the room

    // add the joining user's data to the list of players in the room
    const roomUpdate = {
      ...room,
      players: [
        ...room.players,
        { id: socket.id, username: args.username, email: args.email },
      ],
    };

    rooms.set(args.roomId, roomUpdate);

    callback(roomUpdate); // respond to the client with the room details.
    socket.to(args.roomId).emit("opponentJoined", roomUpdate);
  });

  //track move
  socket.on("move", (data) => {
    // emit to all sockets in the room except the emitting socket.
    socket.to(data.room).emit("move", data.move);
  });

  // disconnection handling
  socket.on("disconnect", () => {
    const gameRooms = Array.from(rooms.values()); // <- 1

    gameRooms.forEach((room) => {
      // <- 2
      const userInRoom = room.players.find((player) => player.id === socket.id); // <- 3

      if (userInRoom) {
        if (room.players.length < 2) {
          // if there's only 1 player in the room, close it and exit.
          rooms.delete(room.roomId);
          return;
        }

        socket.to(room.roomId).emit("playerDisconnected", userInRoom); // <- 4
      }
    });
  });
  socket.on("checkmate", async ({ winnerId, loserId, roomId }) => {
    try {
      console.log(`Checkmate detected! Winner: ${winnerId}, Loser: ${loserId}`);

      // Fetch winner from database and update leaderboard
      const winner = await User.findById(winnerId);
      if (!winner) {
        return socket.emit("gameOver", { error: "Winner not found" });
      }

      // Update leaderboard logic (increase wins for the winner)
      let leaderboardEntry = await Leaderboard.findOne({ userId: winnerId });
      if (!leaderboardEntry) {
        leaderboardEntry = new Leaderboard({
          userId: winnerId,
          username: winner.name,
          wins: 1,
          losses: 0,
        });
      } else {
        leaderboardEntry.wins += 1;
      }
      await leaderboardEntry.save();

      // Update losses for the loser
      if (loserId) {
        let loserEntry = await Leaderboard.findOne({ userId: loserId });
        if (!loserEntry) {
          const loser = await User.findById(loserId);
          loserEntry = new Leaderboard({
            userId: loserId,
            username: loser ? loser.name : "Unknown",
            wins: 0,
            losses: 1,
          });
        } else {
          loserEntry.losses += 1;
        }
        await loserEntry.save();
      }

      // Emit updated leaderboard to all users
      const updatedLeaderboard = await Leaderboard.find().sort({ wins: -1 });

      io.emit("gameOver", { success: true, updatedLeaderboard });

      // Close the room after game ends
      rooms.delete(roomId);
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      socket.emit("gameOver", { error: "Failed to update leaderboard" });
    }
  });
});

// root route
app.get("/", (req, res) => {
  res.send("Happy coding!");
});

// routes
app.use("/auth", require("./routes/user"));
app.use("/games", require("./routes/game"));
app.use("/leaderboards", require("./routes/leaderboard"));
app.use("/openings", require("./routes/openings"));

// Define server port
const PORT = process.env.PORT || 5555;

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const { Server } = require("socket.io");
// const { v4: uuidV4 } = require("uuid");
// const http = require("http"); // Import HTTP module

// // Create the express app
// const app = express();

// // Middleware
// app.use(express.json());
// app.use(cors());

// // Connect to MongoDB
// mongoose
//   .connect("mongodb://localhost:27017/chesshub")
//   .then(() => console.log("MongoDB is connected"))
//   .catch((error) => console.log(error));

// // Create HTTP server and upgrade to WebSocket server
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow connections from any origin
//   },
// });

// // Handle WebSocket connections
// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.id}`);
//   });
// });

// // Root route
// app.get("/", (req, res) => {
//   res.send("Happy coding!");
// });

// // Routes
// app.use("/auth", require("./routes/user"));
// app.use("/games", require("./routes/game"));
// app.use("/leaderboards", require("./routes/leaderboard"));

// // Define server port
// const PORT = process.env.PORT || 5555;

// // Start the server
// server.listen(PORT, () => {
//   console.log(`Server is running at http://localhost:${PORT}`);
// });
