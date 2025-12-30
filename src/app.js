const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const logger = require("./utils/logger");
const correlationId = require("./middlewares/correlationId.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");
const { generalLimiter } = require("./middlewares/rateLimit.middleware");
const systemRoutes = require("./routes/system.routes");
const articlesRoutes = require("./routes/articles.routes");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const authRoutes = require("./routes/auth.routes");

const openapiSpec = YAML.load("./src/docs/openapi.yaml");

const app = express();

// === Core parsers ===
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// === Security hardening ===
app.use(
  cors({
    origin: "*", // untuk praktikum, ijinkan semua. Nanti bisa diubah ke whitelist domain tertentu
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-correlation-id"],
  })
);
app.use(helmet());
app.use(generalLimiter); // rate limit global

// === Observability ===
app.use(correlationId); // correlation id first
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      cid: req.correlationId,
      userId: req.user?.id, // akan terisi setelah JWT aktif
    }),
  })
);

// === Routes ===
app.use(systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/articles", articlesRoutes);

// === DOCS ===
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// === Not found & error ===
app.use(notFound);
app.use(errorHandler);

module.exports = app;