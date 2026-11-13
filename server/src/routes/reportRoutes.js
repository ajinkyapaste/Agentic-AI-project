const express = require('express');
const { prisma } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const {
  generatePdfReport,
  generateExcelReport,
  generateCsvData,
} = require('../services/reportExporter');

const router = express.Router({ mergeParams: true });

/**
 * GET /api/reports/:datasetId/pdf
 * Download executive PDF report
 */
router.get('/:datasetId/pdf', authenticateToken, async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({ where: { id: req.params.datasetId } });
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    const records = await prisma.saleRecord.findMany({ where: { datasetId: dataset.id } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sales_intelligence_report_${dataset.id.slice(0, 8)}.pdf"`
    );

    generatePdfReport(dataset, records, res);
  } catch (error) {
    console.error('PDF report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF report.' });
  }
});

/**
 * GET /api/reports/:datasetId/excel
 * Download multi-sheet Excel workbook
 */
router.get('/:datasetId/excel', authenticateToken, async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({ where: { id: req.params.datasetId } });
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    const records = await prisma.saleRecord.findMany({ where: { datasetId: dataset.id } });
    const workbook = await generateExcelReport(dataset, records);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sales_data_${dataset.id.slice(0, 8)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate Excel report.' });
  }
});

/**
 * GET /api/reports/:datasetId/csv
 * Download clean CSV dataset
 */
router.get('/:datasetId/csv', authenticateToken, async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({ where: { id: req.params.datasetId } });
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    const records = await prisma.saleRecord.findMany({ where: { datasetId: dataset.id } });
    const csvContent = generateCsvData(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sales_records_${dataset.id.slice(0, 8)}.csv"`
    );

    return res.send(csvContent);
  } catch (error) {
    console.error('CSV report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate CSV report.' });
  }
});

module.exports = router;

