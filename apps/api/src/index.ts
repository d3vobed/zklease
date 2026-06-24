import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import verificationRoutes from "./routes/verification.js";
import credentialRoutes from "./routes/credentials.js";
import { getStats } from "./services/storage.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);

app.use(cors({
  origin: [
    "https://zklease.vercel.app",
    "https://web-navy-kappa-19.vercel.app",
    "https://web-62j2qzasr-d3vobeds-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.get("/api/stats", (_req, res) => {
  res.json(getStats());
});

app.use("/api/verification", verificationRoutes);
app.use("/api/credential", credentialRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "The requested endpoint does not exist",
  });
});

app.listen(PORT, () => {
  console.log(`ZKLease API running on http://localhost:${PORT}`);
});

export default app;
