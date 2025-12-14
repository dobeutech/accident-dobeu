const express = require('express');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');
const os = require('os');

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    status: 'healthy',
    checks: {}
  };

  // Database check
  try {
    await sequelize.authenticate();
    const [result] = await sequelize.query('SELECT NOW() as time');
    checks.checks.database = {
      status: 'healthy',
      responseTime: result[0]?.time ? 'ok' : 'unknown'
    };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    logger.error('Database health check failed:', error);
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
  
  checks.checks.memory = {
    status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    systemUsage: `${memoryUsagePercent.toFixed(2)}%`
  };

  // CPU check
  const cpus = os.cpus();
  const avgLoad = os.loadavg();
  checks.checks.cpu = {
    status: avgLoad[0] < cpus.length * 0.8 ? 'healthy' : 'warning',
    cores: cpus.length,
    loadAverage: {
      '1min': avgLoad[0].toFixed(2),
      '5min': avgLoad[1].toFixed(2),
      '15min': avgLoad[2].toFixed(2)
    }
  };

  // Disk check (if available)
  try {
    const fs = require('fs');
    const stats = fs.statfsSync('/');
    const diskUsagePercent = ((stats.blocks - stats.bfree) / stats.blocks) * 100;
    checks.checks.disk = {
      status: diskUsagePercent < 90 ? 'healthy' : 'warning',
      usage: `${diskUsagePercent.toFixed(2)}%`
    };
  } catch (error) {
    checks.checks.disk = {
      status: 'unknown',
      error: 'Unable to check disk usage'
    };
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

// Readiness check (for Kubernetes/load balancers)
router.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Metrics endpoint (basic)
router.get('/metrics', (req, res) => {
  const { getMetrics } = require('../middleware/performanceMonitoring');
  const performanceMetrics = getMetrics();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    performance: performanceMetrics.summary,
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg()
    }
  };

  res.json(metrics);
});

module.exports = router;
