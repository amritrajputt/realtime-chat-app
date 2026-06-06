# Real-time Chat Application

A high-performance, horizontally scalable real-time chat application built with Node.js, Express, TypeScript, Socket.IO, and Redis.

---

## 🗺️ Project Architecture & Roadmap

This project is divided into 4 key development phases, all of which are **Completed**:

1. **Phase 1: Basic Message Flow** - Standard client-server communication using Socket.IO.
2. **Phase 2: History Sync for New Users** - In-memory history caching for newly connected users.
3. **Phase 3: Horizontal Scaling (Redis Pub/Sub)** - Multi-instance clustering support using a Valkey/Redis message broker.
4. **Phase 4: Rate Limiting** - Message flood protection utilizing a fixed-window throttling algorithm.

---

## ⚙️ Technical Deep-Dive

### 1. Horizontal Scaling & Server Clustering (Redis Pub/Sub)
WebSocket connections are persistent and stateful, meaning a client connected to **Server A** cannot directly communicate with a client connected to **Server B**. 

To resolve this and support horizontal scaling, we implemented a Pub/Sub coordinator:

```text
  Client A ──> Server A (Port 4000)
                  │
                  ▼ (Publisher Client)
               [ Redis Pub/Sub "chat" channel ]
                  │
                  ▼ (Subscriber Clients)
       ┌──────────────────────────┐
       │                          │
       ▼                          ▼
 Server A (Port 4000)      Server B (Port 5000)
       │                          │
       ▼ (io.emit)                ▼ (io.emit)
  Client A                   Client B
```

* **Publish/Subscribe Split**: A single Redis connection in subscription mode is blocked from executing other commands. Therefore, we instantiate two separate Redis connections:
  * `publisher`: Handles database queries (`RPUSH`, `LRANGE`) and publishes outgoing chat events.
  * `subscriber`: Dedicated solely to listening for the `"chat"` channel events.
* **Message Delivery**: When a user emits a chat message to their server, that server writes the message to history and publishes it to Redis. Redis immediately broadcasts the event to all server instances, which then emit it to their local socket connections.

### 2. Capped Message History (Redis Lists)
Instead of keeping messages in a local memory array (which gets lost on server restarts and is not shared across instances), we store history in Redis:

* **Append (`RPUSH`)**: New messages are appended to the right (tail) of the Redis list named `chat_history`.
* **Eviction (`LTRIM`)**: To prevent memory bloat, we run `LTRIM chat_history -100 -1` after every push. This retains only the 100 most recent messages (indices `-100` to `-1`) and discards older ones from the left (head).
* **Load (`LRANGE`)**: When a client loads or refreshes the page, they request `/load-messages` which executes `LRANGE chat_history 0 -1` to retrieve the entire capped history chronologically.

### 3. Distributed Rate Limiting (Redis-Backed)
To protect server resources and prevent spam consistently across all server instances, we implemented a **Redis-backed Fixed-Window Rate Limiter**:

* **Limitation Rules**: Users are capped at a maximum of **3 messages every 10 seconds**.
* **State Management & Expiry**: 
  * We store the rate limit counter directly in Redis using the key `ratelimit:${socket.id}`.
  * When a message is sent, we atomically increment the counter using `INCR`.
  * If the counter value is `1` (indicating the start of a new window), we set a `10` second expiration on the key using `EXPIRE`.
  * If the counter value exceeds `3`, the message is blocked and a rate limit warning is sent back to the socket.
* **Auto Cleanup**: Because the keys have a Redis-enforced TTL of 10 seconds, they expire and clean up automatically. No manual garbage collection or `disconnect` handler cleanup is needed on the application server.

### 4. Session Persistence (Local Storage)
Because socket connections assign a new random `socket.id` on page refresh or reconnection, using `socket.id` as the message sender key causes historical messages to misalign (shifting from the right to the left).

* **Persistent User ID**: We generate a unique `userId` on the client and store it in `localStorage`.
* **Styling Preservation**: The client includes this `userId` in the message payloads and checks it when rendering, ensuring the user's own messages always align to the right side (sender styling) regardless of page refreshes.

---

## 🛠️ Tech Stack
* **Runtime**: Node.js (ES Modules)
* **Language**: TypeScript
* **Server**: Express
* **Real-time Engine**: Socket.IO
* **Database/Broker**: Valkey / Redis (running in Docker container)
* **Styling**: Vanilla CSS (Simple Dark Mode)
