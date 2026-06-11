import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { eventsRouter } from "./routes/events";
import { tasksRouter } from "./routes/tasks";
import { usersRouter } from "./routes/users";
import { adminRouter } from "./routes/admin";
import { productionCalendarRouter } from "./routes/productionCalendar";
import { notificationsRouter } from "./routes/notifications";
import { attendanceRouter } from "./routes/attendance";
import { leadsRouter } from "./routes/leads";
import { adminLeadsRouter } from "./routes/adminLeads";
import { quotationsRouter } from "./routes/quotations";
import { adminQuotationsRouter } from "./routes/adminQuotations";
import { attachSocket } from "./realtime/socket";
import { startCronJobs } from "./services/cron";
import { runInitialSeed } from "./services/initialSeed";
import { ensureDataCopySpocAssignments } from "./services/dataCopySpoc";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) =>
  res.json({ ok: true, features: { assignmentSyncV2: true, crewNotify: false } }),
);

app.use("/auth", authRouter);
app.use("/events", eventsRouter);
app.use("/tasks", tasksRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/production-calendar", productionCalendarRouter);
app.use("/notifications", notificationsRouter);
app.use("/attendance", attendanceRouter);
app.use("/leads", leadsRouter);
app.use("/admin/leads", adminLeadsRouter);
app.use("/quotations", quotationsRouter);
app.use("/admin", adminQuotationsRouter);

app.use(errorHandler);

const server = http.createServer(app);
attachSocket(server);

async function start() {
  await runInitialSeed({ wipeExisting: false });
  await ensureDataCopySpocAssignments();
  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on :${env.PORT}`);
  });
  startCronJobs();
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
