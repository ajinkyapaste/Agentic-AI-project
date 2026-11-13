const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const { prisma } = require('./db');
const { cleanAndValidateDataset, inspectRawDataset } = require('./services/dataValidator');
require('dotenv').config();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'ajinkya';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345678';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@salesintelligence.local';

/**
 * Helper to parse a CSV file into array of raw objects
 */
function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

async function seed() {
  console.log('🌱 Starting Sales Intelligence Database Seed...');

  // 1. Initialize or find Admin User
  let admin = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
  });

  if (!admin) {
    console.log(`🔐 Hashing password and initializing admin user: ${ADMIN_USERNAME}`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    admin = await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin user created successfully (ID: ${admin.id})`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${ADMIN_USERNAME}`);
  }

  // 2. Check and seed sample CSV datasets from project root
  const rootDir = path.resolve(__dirname, '../../');
  const sampleFiles = [
    { name: 'Electronics Demand & Telemetry', file: 'electronics.csv' },
    { name: 'Automotive & Vehicles Sales', file: 'cars.csv' },
    { name: 'Cosmetics & Beauty Intelligence', file: 'cosmetics.csv' },
    { name: 'Groceries & Essentials Flow', file: 'groceries.csv' },
    { name: 'Pharmaceutical & Medicines Data', file: 'medicines.csv' },
  ];

  for (const item of sampleFiles) {
    const csvPath = path.join(rootDir, item.file);
    if (!fs.existsSync(csvPath)) continue;

    // Check if dataset already seeded
    const existing = await prisma.dataset.findFirst({
      where: { originalFilename: item.file },
    });

    if (existing) {
      console.log(`ℹ️ Dataset already seeded: ${item.name}`);
      continue;
    }

    console.log(`📊 Processing and seeding sample dataset: ${item.file}`);
    const rawRows = await parseCsvFile(csvPath);
    if (!rawRows.length) continue;

    const stats = fs.statSync(csvPath);
    const inspected = inspectRawDataset(rawRows);
    const { cleanedRecords, validationReport, summaryMetrics } = cleanAndValidateDataset(
      rawRows,
      inspected.suggestedMapping
    );

    const dataset = await prisma.dataset.create({
      data: {
        name: item.name,
        originalFilename: item.file,
        fileSize: stats.size,
        rowCount: cleanedRecords.length,
        columnCount: inspected.columnCount,
        detectedColumns: JSON.stringify(inspected.detectedColumns),
        columnMapping: JSON.stringify(inspected.suggestedMapping),
        validationReport: JSON.stringify(validationReport),
        summaryMetrics: JSON.stringify(summaryMetrics),
        status: 'READY',
        userId: admin.id,
      },
    });

    // Bulk create records in batches of 100
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

    // In SQLite or Postgres, createMany or sequential batch create
    for (let i = 0; i < recordsToInsert.length; i += 100) {
      const batch = recordsToInsert.slice(i, i + 100);
      await prisma.saleRecord.createMany({
        data: batch,
      });
    }

    console.log(`✅ Seeded ${recordsToInsert.length} records for ${item.name}`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

if (require.main === module) {
  seed()
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seed };

