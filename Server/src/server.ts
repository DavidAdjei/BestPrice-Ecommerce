import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { registerSocketHandlers } from "./sockets/chat.socket.js";

const PORT = process.env.PORT ?? 8000;

// Create io WITHOUT attaching it to a server yet, so we can hand this
// `io` instance to Express (chat routes emit through it) while still
// controlling attach order below.
const io = new Server({
  cors: {
    origin: process.env.CLIENT_SIDE_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

registerSocketHandlers(io);

const app = createApp(io);

// Express must become the server's request listener BEFORE Socket.IO
// attaches — io.attach() captures whatever listener already exists and
// wraps it, routing /socket.io/* to itself and everything else to
// Express. Attaching in the other order (as before) makes both try to
// write a response to the same /socket.io/* request independently,
// which is the ERR_HTTP_HEADERS_SENT crash you hit.
const server = http.createServer(app);
io.attach(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});