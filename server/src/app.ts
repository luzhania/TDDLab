import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import server from "./config/server";

// Rutas existentes
import router from "./routes/userRoutes";
import assignmentsRouter from "./routes/assignmentRoutes";
import TDDCyclesRouter from "./routes/TDDCyclesRoutes";
import groupsRouter from "./routes/groupsRouter";
import submissionsRouter from "./routes/submissionRoutes";
import teacherCommentsOnSubmissionRouter from "./routes/teacherCommentsOnSubmissionsRoutes";
import practicesRouter from "./routes/practicesRoutes";
import practiceSubmissionsRouter from "./routes/practiceSubmissionsRoutes";
import aiAssistantRouter from "./routes/AIAssistant";
import featureFlagsRouter from "./routes/featureFlagsRoutes";
import commitRoutes from "./routes/commitRoutes";

const app = express();
const port = 3000;

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json());
app.use(cookieParser());

// CORS - Configuración existente
app.use(cors({
  origin: process.env.VITE_FRONT_URL, 
  credentials: true,
}));

// Rutas existentes
app.use("/api/user", router);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/TDDCycles", TDDCyclesRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/commentsSubmission", teacherCommentsOnSubmissionRouter);
app.use("/api/practices", practicesRouter);
app.use("/api/practiceSubmissions", practiceSubmissionsRouter);
app.use("/api/AIAssistant", aiAssistantRouter);
app.use("/api/featureFlags", featureFlagsRouter);
app.use("/api", commitRoutes);

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: "OK", 
    message: "TDDLab Backend is running",
    timestamp: new Date().toISOString()
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    error: "Route not found",
    message: "The requested endpoint does not exist" 
  });
});

server(app, port);

export default app;