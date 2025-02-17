import authRouter from "./modules/auth/auth.routes";
import { router } from "./trpc";

const appRouter = router({
  auth: authRouter,
});

export default appRouter;
