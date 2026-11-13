const express = require('express');
const { prisma } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const {
  generateExecutiveInsights,
  processAiChatQuery,
} = require('../services/aiInsightsEngine');

const router = express.Router({ mergeParams: true });

/**
 * GET /api/ai/:datasetId/insights
 * Retrieve evidence-based executive business insights
 */
router.get('/:datasetId/insights', authenticateToken, async (req, res) => {
  try {
    const records = await prisma.saleRecord.findMany({
      where: { datasetId: req.params.datasetId },
    });

    if (!records.length) {
      return res.status(404).json({ success: false, message: 'Dataset has no records.' });
    }

    const insights = generateExecutiveInsights(records);
    return res.json({ success: true, insights });
  } catch (error) {
    console.error('Insights generation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI insights.' });
  }
});

/**
 * POST /api/ai/:datasetId/chat
 * Natural language chat query with dataset telemetry
 */
router.post('/:datasetId/chat', authenticateToken, async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { message, selectedProduct, selectedCategory } = req.body;

    const where = { datasetId };
    if (selectedCategory && selectedCategory !== 'All') {
      where.category = selectedCategory;
    }

    const records = await prisma.saleRecord.findMany({ where });

    if (!records.length) {
      return res.status(404).json({ success: false, message: 'No records found for chat context.' });
    }

    const result = processAiChatQuery(records, message, { selectedProduct, selectedCategory });

    // Save interaction to chat history
    try {
      await prisma.aiChatHistory.create({
        data: {
          datasetId,
          userId: req.user?.id || null,
          question: message || 'Default Greeting',
          response: result.response,
          contextData: JSON.stringify(result.metrics || {}),
        },
      });
    } catch (e) {
      // non-blocking
    }

    return res.json(result);
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process AI chat query.' });
  }
});

module.exports = router;

