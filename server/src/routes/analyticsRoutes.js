const express = require('express');
const { prisma } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const {
  getExecutiveKpis,
  getSeasonalAnalytics,
  getTimeTrends,
  getProductAnalytics,
  getCategoryAnalytics,
  getRegionAnalytics,
  getCustomerSegmentAnalytics,
} = require('../services/statisticalEngine');

const router = express.Router({ mergeParams: true });

/**
 * Helper to fetch records for a dataset with optional query filters
 */
async function getFilteredRecords(datasetId, query) {
  const where = { datasetId };
  if (query.category && query.category !== 'All') {
    where.category = query.category;
  }
  if (query.season && query.season !== 'All') {
    where.season = query.season;
  }
  if (query.region && query.region !== 'All') {
    where.region = query.region;
  }
  if (query.month && query.month !== 'All') {
    where.month = query.month;
  }

  return prisma.saleRecord.findMany({ where });
}

/**
 * GET /api/analytics/:datasetId/kpis
 */
router.get('/:datasetId/kpis', authenticateToken, async (req, res) => {
  try {
    const records = await getFilteredRecords(req.params.datasetId, req.query);
    const kpis = getExecutiveKpis(records);
    return res.json({ success: true, kpis });
  } catch (error) {
    console.error('KPIs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute KPIs.' });
  }
});

/**
 * GET /api/analytics/:datasetId/seasonal
 */
router.get('/:datasetId/seasonal', authenticateToken, async (req, res) => {
  try {
    const records = await getFilteredRecords(req.params.datasetId, req.query);
    const seasonal = getSeasonalAnalytics(records);
    return res.json({ success: true, seasonal });
  } catch (error) {
    console.error('Seasonal analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute seasonal analytics.' });
  }
});

/**
 * GET /api/analytics/:datasetId/trends
 */
router.get('/:datasetId/trends', authenticateToken, async (req, res) => {
  try {
    const records = await getFilteredRecords(req.params.datasetId, req.query);
    const trends = getTimeTrends(records);
    return res.json({ success: true, trends });
  } catch (error) {
    console.error('Trends analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute trends.' });
  }
});

/**
 * GET /api/analytics/:datasetId/products
 */
router.get('/:datasetId/products', authenticateToken, async (req, res) => {
  try {
    const records = await getFilteredRecords(req.params.datasetId, req.query);
    const products = getProductAnalytics(records);
    return res.json({ success: true, products });
  } catch (error) {
    console.error('Product analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute product analytics.' });
  }
});

/**
 * GET /api/analytics/:datasetId/categories
 */
router.get('/:datasetId/categories', authenticateToken, async (req, res) => {
  try {
    const records = await getFilteredRecords(req.params.datasetId, req.query);
    const categories = getCategoryAnalytics(records);
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Category analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute category analytics.' });
  }
});

/**
 * GET /api/analytics/:datasetId/regions
 */
router.get('/:datasetId/regions', authenticateToken, async (req, res) => {
  try {
    const records = await getFilteredRecords(req.params.datasetId, req.query);
    const regions = getRegionAnalytics(records);
    return res.json({ success: true, regions });
  } catch (error) {
    console.error('Region analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute region analytics.' });
  }
});

/**
 * GET /api/analytics/:datasetId/segments
 */
router.get('/:datasetId/segments', authenticateToken, async (req, res) => {
  try {
    const records = await getFilteredRecords(req.params.datasetId, req.query);
    const segments = getCustomerSegmentAnalytics(records);
    return res.json({ success: true, segments });
  } catch (error) {
    console.error('Segment analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute customer segments.' });
  }
});

module.exports = router;

