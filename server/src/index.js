const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const forecastingRoutes = require('./routes/forecastingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for local dev & production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Sales Intelligence & AI Analytics Platform Backend',
    version: '1.0.0',
  });
});

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forecasting', forecastingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);

// Serve Client production build if present
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 Not Found Middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Sales Intelligence Backend running on http://localhost:${PORT}`);
    console.log(`📡 Healthcheck available at http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;

