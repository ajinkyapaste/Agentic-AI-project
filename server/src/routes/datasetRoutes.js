const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { prisma } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { inspectRawDataset, cleanAndValidateDataset } = require('../services/dataValidator');

const router = express.Router();

// Configure Multer storage
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 25) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, XLS, and XLSX file formats are supported.'));
    }
  },
});

/**
 * Helper to parse uploaded file into raw rows array
 */
function parseUploadedFile(filePath, ext) {
  return new Promise((resolve, reject) => {
    if (ext === '.csv') {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (d) => results.push(d))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    } else {
      // Excel (.xls, .xlsx)
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = xlsx.utils.sheet_to_json(sheet, { defval: '' });
        resolve(rawJson);
      } catch (err) {
        reject(err);
      }
    }
  });
}

/**
 * GET /api/datasets
 * List all available datasets
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        originalFilename: true,
        fileSize: true,
        rowCount: true,
        columnCount: true,
        status: true,
        summaryMetrics: true,
        validationReport: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { username: true },
        },
      },
    });

    const parsed = datasets.map((d) => ({
      ...d,
      summaryMetrics: JSON.parse(d.summaryMetrics || '{}'),
      validationReport: JSON.parse(d.validationReport || '{}'),
    }));

    return res.json({ success: true, datasets: parsed });
  } catch (error) {
    console.error('Fetch datasets error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve datasets.' });
  }
});

/**
 * POST /api/datasets/inspect
 * Step 1 of Upload: Ingest file, extract schema, infer types, and suggest column mapping
 */
router.post('/inspect', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const rawRows = await parseUploadedFile(req.file.path, ext);

    if (!rawRows.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Uploaded file is empty.' });
    }

    const inspection = inspectRawDataset(rawRows);

    return res.json({
      success: true,
      tempFileId: req.file.filename,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      rowCount: inspection.rowCount,
      columnCount: inspection.columnCount,
      detectedColumns: inspection.detectedColumns,
      suggestedMapping: inspection.suggestedMapping,
      canonicalDefinitions: inspection.canonicalDefinitions,
      sampleRows: rawRows.slice(0, 5),
    });
  } catch (error) {
    console.error('Inspection error:', error);
    return res.status(500).json({ success: false, message: error.message || 'File inspection failed.' });
  }
});

/**
 * POST /api/datasets/confirm
 * Step 2 of Upload: Clean, validate with confirmed mapping, and commit to database
 */
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { tempFileId, name, columnMapping } = req.body;
    if (!tempFileId) {
      return res.status(400).json({ success: false, message: 'tempFileId is required.' });
    }

    const filePath = path.join(uploadDir, tempFileId);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Temporary upload file expired or missing.' });
    }

    const ext = path.extname(tempFileId).toLowerCase();
    const rawRows = await parseUploadedFile(filePath, ext);
    const stats = fs.statSync(filePath);

    const inspection = inspectRawDataset(rawRows);
    const { cleanedRecords, validationReport, summaryMetrics } = cleanAndValidateDataset(
      rawRows,
      columnMapping || inspection.suggestedMapping
    );

    // Save Dataset metadata
    const dataset = await prisma.dataset.create({
      data: {
        name: (name || tempFileId).trim(),
        originalFilename: tempFileId,
        fileSize: stats.size,
        rowCount: cleanedRecords.length,
        columnCount: inspection.columnCount,
        detectedColumns: JSON.stringify(inspection.detectedColumns),
        columnMapping: JSON.stringify(columnMapping || inspection.suggestedMapping),
        validationReport: JSON.stringify(validationReport),
        summaryMetrics: JSON.stringify(summaryMetrics),
        status: 'READY',
        userId: req.user.id,
      },
    });

    // Bulk insert clean sale records
    const recordsToInsert = cleanedRecords.map((r) => ({
      datasetId: dataset.id,
      productId: r.productId,
      productName: r.productName,
      category: r.category,
      region: r.region || 'Global',
      price: r.price || 0,
      cost: r.cost || 0,
      stock: r.stock || 0,
      monthlySales: r.monthlySales || 0,
      revenue: r.revenue || 0,
      profit: r.profit || 0,
      marginPercentage: r.marginPercentage || 0,
      customerSegment: r.customerSegment || 'mid',
      season: r.season || 'All Season',
      festival: r.festival || 'None',
      marketTrendScore: r.marketTrendScore || 5,
      predictedGrowth: r.predictedGrowth || 0,
      month: r.month || 'January',
      quarter: r.quarter || 'Q1',
      year: r.year || 2026,
    }));

    for (let i = 0; i < recordsToInsert.length; i += 100) {
      const batch = recordsToInsert.slice(i, i + 100);
      await prisma.saleRecord.createMany({ data: batch });
    }

    // Clean up temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // ignore
    }

    return res.status(201).json({
      success: true,
      message: 'Dataset uploaded, mapped, validated, and stored successfully.',
      dataset: {
        ...dataset,
        summaryMetrics,
        validationReport,
      },
    });
  } catch (error) {
    console.error('Confirm dataset upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Dataset processing failed.' });
  }
});

/**
 * GET /api/datasets/:id
 * Retrieve single dataset with full metrics and sample records
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    const records = await prisma.saleRecord.findMany({
      where: { datasetId: dataset.id },
      take: 100,
    });

    return res.json({
      success: true,
      dataset: {
        ...dataset,
        detectedColumns: JSON.parse(dataset.detectedColumns || '[]'),
        columnMapping: JSON.parse(dataset.columnMapping || '{}'),
        validationReport: JSON.parse(dataset.validationReport || '{}'),
        summaryMetrics: JSON.parse(dataset.summaryMetrics || '{}'),
      },
      sampleRecords: records,
    });
  } catch (error) {
    console.error('Get dataset error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dataset.' });
  }
});

/**
 * DELETE /api/datasets/:id
 * Delete dataset and all associated records
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }

    await prisma.dataset.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Dataset deleted successfully.' });
  } catch (error) {
    console.error('Delete dataset error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete dataset.' });
  }
});

module.exports = router;

