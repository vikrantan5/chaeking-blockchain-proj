import { Server } from "socket.io";
import http from "http";
import { app } from "./app.js"; // Your Express app

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Frontend URL
        methods: ["GET", "POST"],
    },
});

// WebSocket connection
io.on("connection", (socket) => {
    // console.log("A client connected:", socket.id);

    // Notify all clients when a new confirmation is added
    socket.on("new-confirmation", (data) => {
        io.emit("update-confirmations", data); // Broadcast to all connected clients
    });

    socket.on("disconnect", () => {
        // console.log("A client disconnected:", socket.id);
    });
});

// setTimeout(() => {
//     io.emit("update-confirmations", {
//         templeAdminId: "test-id",
//         templeName: "Test Temple",
//         walletAddress: "0x123456789abcdef",
//         status: "pending",
//     });
//     console.log("Test event emitted");
// }, 5000); // Emit after 5 seconds

export { io, server };