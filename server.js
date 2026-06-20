require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const userRoutes = require("./routes/users");
const chatRoutes = require("./routes/chats");
const reviewRoutes = require("./routes/reviews");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Core middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded book photos statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "HandOnMe API is running" });
});

// Mount routes under /api
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/reviews", reviewRoutes);

// Socket.io setup for real-time messaging
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join a specific chat room.
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  // Broadcast a message to everyone in the chat room.
  socket.on("sendMessage", ({ chatId, message }) => {
    io.to(chatId).emit("newMessage", message);
  });

  // Typing indicator.
  socket.on("typing", ({ chatId, user }) => {
    socket.to(chatId).emit("typing", { user });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible to controllers if needed.
app.set("io", io);

const PORT = process.env.PORT || 5000;

// Surface port-in-use errors with a clear, actionable message instead of an
// unhandled 'error' event crash dump.
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Another process (likely a previous ` +
        `server instance) is still running. Stop it and try again.`
    );
    process.exit(1);
  }
  throw err;
});

// Connect to MongoDB, then start the server.
const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();

module.exports = { app, server, io };
