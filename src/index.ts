import http from "http";

import express from "express";
import { Server } from "socket.io";
import type { Request, Response } from "express";


const messages: { id: string, text: string }[] = [];
const MAX_MESSAGES = 100;

async function main() {
    const app = express();

    const server = http.createServer(app);

    const io = new Server();
    io.attach(server);
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("chat message", (msg: { id: string, text: string }) => {
            messages.push(msg);
            if (messages.length > MAX_MESSAGES) {
                messages.shift();
            }
            io.emit("chat message", msg);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
    app.use(express.json());
    app.use(express.static("./public"));

    server.listen(3000, () => {
        console.log("Server running on port 3000");
    });
    app.post("/push-messages", (req: Request, res: Response) => {
        const { id, text } = req.body;
        messages.push({ id, text });
        if (messages.length > MAX_MESSAGES) {
            messages.shift();
        }
        res.send("Message sent");
    });
    app.get("/load-messages", (req: Request, res: Response) => {
        res.json(messages);
    });
}

await main();