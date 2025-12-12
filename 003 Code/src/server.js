require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Import swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");

// Import configuration and utilities
const logger = require("./utils/logger");
const { connectDatabase } = require("./config/database");

// Import scheduler services
const SchedulerService = require("./services/SchedulerService");
const EmergencyMonitoringService = require("./services/EmergencyMonitoringService");

// Import routes
const authRoutes = require("./routes/auth");
const recipientRoutes = require("./routes/recipients");
const messageRoutes = require("./routes/messages");
const customReminderRoutes = require("./routes/customReminders");
const dashboardRoutes = require("./routes/dashboard");
const weatherRoutes = require("./routes/weatherRoutes");

const app = express();
const PORT = 3001;

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-domain.com"]
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
          ],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/public", express.static(path.join(__dirname, "../public")));

// Health check endpoint
app.get("/health", (req, res) => {
  const healthData = {
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Yuseong Care SMS",
    version: "1.0.0",
  };

  if (schedulerService) {
    healthData.scheduler = schedulerService.getSchedulerStatus();
  }
  if (emergencyMonitoringService) {
    healthData.emergencyMonitoring =
      emergencyMonitoringService.getMonitoringStatus();
  }

  res.status(200).json(healthData);
});

// Scheduler management endpoints
app.get("/api/scheduler/status", (req, res) => {
  if (!schedulerService) {
    return res.status(503).json({ error: "Scheduler service not available" });
  }

  res.json({
    scheduler: schedulerService.getSchedulerStatus(),
    emergencyMonitoring: emergencyMonitoringService
      ? emergencyMonitoringService.getMonitoringStatus()
      : null,
  });
});

app.post("/api/scheduler/restart", async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(503).json({ error: "Scheduler service not available" });
    }

    schedulerService.stopAllSchedulers();
    await schedulerService.startAllSchedulers();

    res.json({
      success: true,
      message: "Schedulers restarted successfully",
      status: schedulerService.getSchedulerStatus(),
    });
  } catch (error) {
    logger.error("Failed to restart schedulers:", error);
    res.status(500).json({ error: "Failed to restart schedulers" });
  }
});

app.post("/api/scheduler/emergency-check", async (req, res) => {
  try {
    if (!emergencyMonitoringService) {
      return res
        .status(503)
        .json({ error: "Emergency monitoring service not available" });
    }

    const result = await emergencyMonitoringService.manualEmergencyCheck();
    res.json(result);
  } catch (error) {
    logger.error("Manual emergency check failed:", error);
    res.status(500).json({ error: "Emergency check failed" });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/custom-reminders", customReminderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/weather", weatherRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "Yuseong Care SMS Service",
    status: "Running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Initialize services variables
let schedulerService;
let emergencyMonitoringService;

// ★★★ [수정됨] 서버 초기화 로직 변경 ★★★
(async () => {
  try {
    // 1. DB 연결 시도
    await connectDatabase();
    logger.info("✅ Database connected successfully");

    // 2. 스케줄러 서비스 초기화
    schedulerService = new SchedulerService();
    emergencyMonitoringService = new EmergencyMonitoringService();

    try {
      await schedulerService.startAllSchedulers();
      await emergencyMonitoringService.startMonitoring();
      logger.info("✅ Scheduler services started successfully");
    } catch (schedulerError) {
      logger.warn(
        "⚠️ Scheduler services failed to start:",
        schedulerError.message
      );
    }

    // 3. [핵심] DB 연결 성공 후에 서버 리스닝 시작
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    // 치명적 오류 발생 시 프로세스 종료
    logger.error("❌ Initialization error (Critical):", err.message);
    process.exit(1);
  }
})();

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await gracefulShutdown();
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    if (schedulerService) {
      schedulerService.stopAllSchedulers();
    }
    if (emergencyMonitoringService) {
      await emergencyMonitoringService.shutdown();
    }
    logger.info("Scheduler services stopped");
    // 필요한 경우 DB 연결 종료 코드 추가
  } catch (error) {
    logger.error("Error during shutdown:", error);
  }
  process.exit(0);
}

module.exports = app;
