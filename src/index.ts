import http from "http";

import express from "express";
import { Server } from "socket.io";


async function main() {
    const app = express();

    const server = http.createServer(app);

    const io = new Server();
    io.attach(server);
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("chat message", (msg) => {
            io.emit("chat message", msg);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
    app.use(express.static("./public"));

    server.listen(3000, () => {
        console.log("Server running on port 3000");
    });
}

await main();