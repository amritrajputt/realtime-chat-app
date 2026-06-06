import http from "http";
import express from "express";
import { Server } from "socket.io";
import type { Request, Response } from "express";
import { publisher, subscriber } from "./redis.js";

const MAX_MESSAGES = 100;

const rateLimit: Map<string, { count: number, timestamp: number }> = new Map();

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

        rateLimit.set(socket.id, { count: 0, timestamp: Date.now() });

        socket.on("chat message", async (msg: { id: string, text: string }) => {
            const msgStr = JSON.stringify(msg);
            const time = Date.now();
            const timeWindow = 10000; 
            const maxMessages = 3;

            if (rateLimit.has(socket.id)) {
                const { count, timestamp } = rateLimit.get(socket.id)!;
                if (time - timestamp < timeWindow) {
                    if (count >= maxMessages) {
                        socket.emit("chat message", { id: "system", text: "Rate limit exceeded. Please wait before sending more messages." });
                        return;
                    }
                    rateLimit.set(socket.id, { count: count + 1, timestamp });
                } else {
                
                    rateLimit.set(socket.id, { count: 1, timestamp: time });
                }
            } else {
                rateLimit.set(socket.id, { count: 1, timestamp: time });
            }

            await publisher.rpush("chat_history", msgStr);
            await publisher.ltrim("chat_history", -MAX_MESSAGES, -1);
            await publisher.publish("chat", msgStr);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            rateLimit.delete(socket.id); 
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