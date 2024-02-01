let io;

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer, {
      cors: {
        origin: "https://localhost:3000",
        credentials: true,
        methods: ["GET, POST, PUT, DELETE, OPTIONS, HEAD"],
        allowedHeaders: "Content-Type,Authorization"
      }
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
