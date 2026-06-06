import http from "http";
import express from "express";
import { Server } from "socket.io";
import type { Request, Response } from "express";
import { publisher, subscriber } from "./redis.js";

const MAX_MESSAGES = 100;
async function main() {
    const app = express();

    const server = http.createServer(app);

    

    const io = new Server();
    io.attach(server);

    await subscriber.subscribe("chat");

    subscriber.on("message", (channel: string, message: string) => {
        if (channel === "chat") {
            const msg = JSON.parse(message);
            io.emit("chat message", msg);
        }
    });

    io.on("connection", async (socket) => {
        console.log("User connected:", socket.id);

        socket.on("chat message", async (msg: { id: string, text: string }) => {
            const msgStr = JSON.stringify(msg);
            await publisher.rpush("chat_history", msgStr);
            await publisher.ltrim("chat_history", -MAX_MESSAGES, -1);
            await publisher.publish("chat", msgStr);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    



    app.use(express.json());
    app.use(express.static("./public"));

    const PORT = process.env.PORT || 3000;

    app.post("/push-messages", async (req: Request, res: Response) => {
        const { id, text } = req.body;
        const msg = { id, text };
        const msgStr = JSON.stringify(msg);
        await publisher.rpush("chat_history", msgStr);
        await publisher.ltrim("chat_history", -MAX_MESSAGES, -1);
        await publisher.publish("chat", msgStr);
        res.send("Message sent");
    });
    app.get("/load-messages", async (req: Request, res: Response) => {
        const rawHistory = await publisher.lrange("chat_history", 0, -1);
        const history = rawHistory.map((item) => JSON.parse(item));
        res.json(history);
    });

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });


}

await main();