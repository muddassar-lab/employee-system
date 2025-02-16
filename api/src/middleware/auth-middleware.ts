import Cookies from "cookies";
import type { NextFunction, Request, Response } from "express";
import AuthService from "../modules/auth/auth.service";
import { redis } from "../utils/redis";
import { db } from "../utils/db";
import { users } from "../modules/user/user.schema";
import { eq } from "drizzle-orm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: typeof users.$inferSelect;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = new Cookies(req, res);
    const accessToken = cookies.get("accessToken");
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = new AuthService().verifyAccessToken(accessToken);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const session = await redis.get(`user:${userId}`);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = (
      await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1)
    )[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
