require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import configuration and utilities
const logger = require('./utils/logger');
const { connectDatabase } = require('./config/database');

// Import scheduler services
const SchedulerService = require('./services/SchedulerService');
const EmergencyMonitoringService = require('./services/EmergencyMonitoringService');

// Import routes
const authRoutes = require('./routes/auth');
const recipientRoutes = require('./routes/recipients');
const messageRoutes = require('./routes/messages');
const customReminderRoutes = require('./routes/customReminders');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Yuseong Care SMS',
    version: '1.0.0'
  };

  // Add scheduler status if available
  if (schedulerService) {
    healthData.scheduler = schedulerService.getSchedulerStatus();
  }
  if (emergencyMonitoringService) {
    healthData.emergencyMonitoring = emergencyMonitoringService.getMonitoringStatus();
  }

  res.status(200).json(healthData);
});

// Scheduler management endpoints
app.get('/api/scheduler/status', (req, res) => {
  if (!schedulerService) {
    return res.status(503).json({ error: 'Scheduler service not available' });
  }
  
  res.json({
    scheduler: schedulerService.getSchedulerStatus(),
    emergencyMonitoring: emergencyMonitoringService ? 
      emergencyMonitoringService.getMonitoringStatus() : null
  });
});

app.post('/api/scheduler/restart', async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(503).json({ error: 'Scheduler service not available' });
    }

    schedulerService.stopAllSchedulers();
    await schedulerService.startAllSchedulers();
    
    res.json({ 
      success: true, 
      message: 'Schedulers restarted successfully',
      status: schedulerService.getSchedulerStatus()
    });
  } catch (error) {
    logger.error('Failed to restart schedulers:', error);
    res.status(500).json({ error: 'Failed to restart schedulers' });
  }
});

app.post('/api/scheduler/emergency-check', async (req, res) => {
  try {
    if (!emergencyMonitoringService) {
      return res.status(503).json({ error: 'Emergency monitoring service not available' });
    }

    const result = await emergencyMonitoringService.manualEmergencyCheck();
    res.json(result);
  } catch (error) {
    logger.error('Manual emergency check failed:', error);
    res.status(500).json({ error: 'Emergency check failed' });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/custom-reminders', customReminderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Yuseong Care SMS Service',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize scheduler services
let schedulerService;
let emergencyMonitoringService;

// Start server
async function startServer() {
  try {
    // Try to initialize database connection (optional for now)
    try {
      await connectDatabase();
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.warn('Database connection failed, continuing without database:', dbError.message);
    }

    // Initialize and start scheduler services
    try {
      schedulerService = new SchedulerService();
      emergencyMonitoringService = new EmergencyMonitoringService();
      
      // Start schedulers only if database is available
      if (process.env.NODE_ENV !== 'test') {
        await schedulerService.startAllSchedulers();
        await emergencyMonitoringService.startMonitoring();
        logger.info('Scheduler services started successfully');
      }
    } catch (schedulerError) {
      logger.warn('Scheduler services failed to start:', schedulerError.message);
    }

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await gracefulShutdown();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    // Stop scheduler services
    if (schedulerService) {
      schedulerService.stopAllSchedulers();
    }
    if (emergencyMonitoringService) {
      await emergencyMonitoringService.shutdown();
    }
    logger.info('Scheduler services stopped');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  process.exit(0);
}

startServer();

module.exports = app;