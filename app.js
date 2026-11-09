const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./src/config/env');

const healthRoute = require('./src/routes/health.route');

const app = express();

// Security and middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const fs = require('fs');
const frontendDist = path.join(__dirname, 'frontend', 'dist');

// Static folder (if any fallback assets)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Healthcheck endpoint
app.use('/health', healthRoute);
app.use('/healthz', healthRoute);

// API router mounted
const apiRouter = require('./src/routes/index');
app.use('/api', apiRouter);

// Serve frontend static build if available (supports unified single-port deployment)
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Root API status fallback when frontend is hosted separately
  app.get('/', (req, res) => {
    res.json({
      service: 'Trash Management API',
      status: 'online',
      version: '1.0.0',
      documentation: '/api'
    });
  });
}

// Catch 404 for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`Trash Management Backend running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

module.exports = app;
