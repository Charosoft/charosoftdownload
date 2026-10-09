import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import analyzeRoutes from "./routes/analyze.routes.js";
import downloadRoutes from "./routes/download.routes.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";


const app = express();

const PORT = Number(process.env.PORT) || 3000;

const limiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_WINDOW_MS) ||
    15 * 60 * 1000,

  limit:
    Number(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    100,

  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// ==========================================
// SECURITY
// ==========================================

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_ORIGIN,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin(origin, callback) {
      // Autorise les outils serveur à serveur sans en-tête Origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origine CORS non autorisée."));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ==========================================
// BODY PARSERS
// ==========================================

// Requêtes JSON
app.use(
  express.json({
    limit: "1mb",
  })
);

// Formulaires HTML classiques
app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==========================================
// LOGS & RATE LIMIT
// ==========================================

app.use(morgan("dev"));
app.use(limiter);
app.use(cookieParser());
// ==========================================
// API ROUTES
// ==========================================

app.use(
  "/api/health",
  healthRoutes
);


app.use(
  "/api/auth", 
  authRoutes
);

app.use(
  "/api/analyze",
  analyzeRoutes
);

app.use(
  "/api/download",
  downloadRoutes
);

// ==========================================
// ROOT
// ==========================================

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "CHAROSOFT DOWNLOAD",
    message: "API en ligne",
  });
});

// ==========================================
// SERVER
// ==========================================

app.listen(PORT, () => {
  console.log("");
  console.log(
    "🟠 CHAROSOFT DOWNLOAD API"
  );

  console.log(
    `🚀 Serveur démarré sur http://localhost:${PORT}`
  );

  console.log(
    `❤️ Health: http://localhost:${PORT}/api/health`
  );

  console.log("");
});