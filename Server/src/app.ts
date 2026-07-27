import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import type { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import orderRoutes from "./routes/order.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import errorLogRoutes from "./routes/errorLog.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const createApp = (io: Server) => {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    cors({
      origin: process.env.CLIENT_SIDE_URL,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

  app.get("/", (_req, res) => {
    res.json({ message: "Best Price API" });
  });

  app.use("/auth", authRoutes);
  app.use("/products", productRoutes);
  app.use("/categories", categoryRoutes);
  app.use("/order", orderRoutes);
  app.use("/wishlist", wishlistRoutes);
  app.use("/seller", sellerRoutes);
  app.use("/cart", cartRoutes);
  app.use("/chat", chatRoutes(io));
  app.use("/admin", adminRoutes);
  app.use("/errors", errorLogRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
  });

  app.use(errorHandler);

  return app;
};
