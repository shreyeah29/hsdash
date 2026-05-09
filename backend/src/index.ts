import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { eventsRouter } from "./routes/events";
import { tasksRouter } from "./routes/tasks";
import { usersRouter } from "./routes/users";
import { startCronJobs } from "./services/cron";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/events", eventsRouter);
app.use("/tasks", tasksRouter);
app.use("/users", usersRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${env.PORT}`);
});

startCronJobs();

