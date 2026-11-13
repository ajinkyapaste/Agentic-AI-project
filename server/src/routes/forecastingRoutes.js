const express = require('express');
const { prisma } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const {
  runBacktest,
  computePredictionIntervals,
  detectAnomalies,
} = require('../services/forecastingEngine');

const router = express.Router({ mergeParams: true });

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * POST /api/forecasting/:datasetId/predict
 * Execute data-driven forecasting with backtesting and confidence intervals
 */
router.post('/:datasetId/predict', authenticateToken, async (req, res) => {
  try {
    const { datasetId } = req.params;
    const {
      targetType = 'revenue', // 'revenue' or 'sales'
      targetName = 'Overall',  // 'Overall', or category/product name
      algorithm = 'HOLT_WINTERS',
      horizon = 4,
      parameters = {},
    } = req.body;

    const where = { datasetId };
    if (targetName !== 'Overall') {
      where.OR = [
        { category: targetName },
        { productName: targetName },
      ];
    }

    const records = await prisma.saleRecord.findMany({ where });

    if (!records.length) {
      return res.status(400).json({
        success: false,
        message: `No records found for target: ${targetName}`,
      });
    }

    // Aggregate time series by month
    const monthAggregation = {};
    MONTH_ORDER.forEach((m) => {
      monthAggregation[m] = 0;
    });

    records.forEach((r) => {
      const val = targetType === 'sales' ? r.monthlySales : r.revenue;
      const m = r.month || 'January';
      monthAggregation[m] = (monthAggregation[m] || 0) + (val || 0);
    });

    // Extract ordered historical points
    const historicalPoints = MONTH_ORDER
      .filter((m) => monthAggregation[m] !== undefined)
      .map((m) => ({
        period: m,
        actual: +monthAggregation[m].toFixed(2),
      }));

    const rawSeries = historicalPoints.map((p) => p.actual);

    // Run backtesting & forecasting
    const result = runBacktest(rawSeries, algorithm, { ...parameters, horizon: parseInt(horizon, 10) || 4 });

    // Compute Confidence Intervals
    const confidenceBands = computePredictionIntervals(result.forecast, result.metrics.rmse || 10);

    // Format forecast points with labels (e.g. Month +1, Month +2, etc.)
    const forecastPoints = result.forecast.map((fVal, idx) => {
      const band = confidenceBands[idx];
      return {
        period: `Period +${idx + 1}`,
        forecast: fVal,
        lower80: band.lower80,
        upper80: band.upper80,
        lower95: band.lower95,
        upper95: band.upper95,
      };
    });

    // Save forecast run to database
    const savedRun = await prisma.forecastRun.create({
      data: {
        datasetId,
        targetType: targetType.toUpperCase(),
        targetName,
        algorithm,
        parameters: JSON.stringify(result.parameters || parameters),
        metrics: JSON.stringify(result.metrics),
        historyData: JSON.stringify(historicalPoints),
        forecastData: JSON.stringify(forecastPoints),
      },
    });

    return res.json({
      success: true,
      runId: savedRun.id,
      algorithm,
      targetType,
      targetName,
      historicalPoints,
      fittedPoints: result.fitted,
      forecastPoints,
      metrics: result.metrics,
      inSampleMetrics: result.inSampleMetrics,
      parameters: result.parameters,
    });
  } catch (error) {
    console.error('Forecasting error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Forecasting failed.' });
  }
});

/**
 * GET /api/forecasting/:datasetId/anomalies
 * Detect statistical anomalies and outliers in dataset records
 */
router.get('/:datasetId/anomalies', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.saleRecord.findMany({
      where: { datasetId: req.params.datasetId },
    });

    const valueField = req.query.field === 'sales' ? 'monthlySales' : 'revenue';
    const report = detectAnomalies(records, valueField);

    return res.json({ success: true, ...report });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return res.status(500).json({ success: false, message: 'Failed to run anomaly detection.' });
  }
});

/**
 * GET /api/forecasting/:datasetId/runs
 * Retrieve history of forecast runs
 */
router.get('/:datasetId/runs', authenticateToken, async (req, res) => {
  try {
    const runs = await prisma.forecastRun.findMany({
      where: { datasetId: req.params.datasetId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const parsed = runs.map((r) => ({
      ...r,
      parameters: JSON.parse(r.parameters || '{}'),
      metrics: JSON.parse(r.metrics || '{}'),
      historyData: JSON.parse(r.historyData || '[]'),
      forecastData: JSON.parse(r.forecastData || '[]'),
    }));

    return res.json({ success: true, runs: parsed });
  } catch (error) {
    console.error('Fetch forecast runs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve forecast history.' });
  }
});

module.exports = router;

