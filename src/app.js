import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());
//router imports
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import noteRouter from "./routes/note.routes.js";
import taskRouter from "./routes/task.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/user", authRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/note", noteRouter);
app.use("/api/v1/task", taskRouter);

export default app;
