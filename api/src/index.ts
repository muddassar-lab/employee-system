import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import "dotenv/config";
import type { Application } from "express";
import express from "express";
import { authMiddleware } from "./middleware/auth-middleware";
import AiController from "./modules/ai/ai.controller";
import appRouter from "./routes";
import { createContext } from "./trpc";

const app: Application = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use("/health", (_, res) => {
  return res.send("OK");
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.use(express.json());
app.post("/ai", authMiddleware, (req, res) =>
  new AiController().accountant(req, res),
);

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on port ${process.env.PORT}`);
});

export type AppRouter = typeof appRouter;
