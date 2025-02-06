import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

let players = {}; // Store player data

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add new player
  players[socket.id] = { x: 0, y: -1.8, z: 0, rotationY: 0 };
  io.emit("updatePlayers", players);

  // Handle movement updates
  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id] = { ...players[socket.id], ...data };
      io.emit("updatePlayers", players);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});
