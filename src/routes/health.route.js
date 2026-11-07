const express = require('express');
const router = express.Router();
const pool = require('../../database/pool');

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    const [rows] = await pool.query('SELECT 1 AS alive');
    if (rows && rows.length > 0) {
      dbStatus = 'connected';
    }
  } catch (error) {
    dbError = error.message;
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 200).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'trash-management-api',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    ...(dbError && { error: dbError })
  });
});

module.exports = router;
