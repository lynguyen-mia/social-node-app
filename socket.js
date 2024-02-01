let io;

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer, {
      cors: {
        origin:
          "https://65bb565dd126114fdb7733b7--velvety-meringue-2cfa3e.netlify.app",
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
