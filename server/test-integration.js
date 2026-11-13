/**
 * Comprehensive End-to-End Integration Verification Suite
 * Tests Auth, Datasets, Dynamic Ingestion, Statistical Analytics,
 * AI/ML Forecasting (Holt-Winters, MA, Naive), AI Chat, and PDF/Excel/CSV Exports.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./src/index');

const PORT = 5005;

async function runTestSuite() {
  console.log('🧪 Starting Sales Intelligence Integration Test Suite...\n');

  const server = app.listen(PORT);
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failedTests++;
    }
  }

  try {
    const baseUrl = `http://localhost:${PORT}/api`;

    // 1. Test Healthcheck
    console.log('1. Testing Healthcheck Endpoint');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'healthy', 'GET /api/health returns healthy');

    // 2. Test Admin Authentication
    console.log('\n2. Testing Admin Authentication (Bcrypt + JWT)');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ajinkya', password: '12345678' }),
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200 && loginJson.success === true, 'Admin login with valid credentials succeeds');
    assert(loginJson.user.username === 'ajinkya', 'Returned user identity is ajinkya');
    assert(typeof loginJson.token === 'string' && loginJson.token.length > 20, 'Valid JWT token generated');
    const token = loginJson.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test Invalid Login
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ajinkya', password: 'wrongpassword' }),
    });
    assert(badLoginRes.status === 401, 'Admin login rejects invalid password');

    // 3. Test Datasets Listing
    console.log('\n3. Testing Datasets Management API');
    const datasetsRes = await fetch(`${baseUrl}/datasets`, { headers: authHeaders });
    const datasetsJson = await datasetsRes.json();
    assert(datasetsRes.status === 200 && Array.isArray(datasetsJson.datasets), 'GET /api/datasets returns list');
    assert(datasetsJson.datasets.length >= 5, `Seeded datasets present (count: ${datasetsJson.datasets.length})`);

    const targetDs = datasetsJson.datasets.find((d) => (d.summaryMetrics?.totalRevenue || 0) > 0) || datasetsJson.datasets[0];
    const datasetId = targetDs.id;
    console.log(`   Using Target Dataset: "${targetDs.name}" (ID: ${datasetId})`);

    // 4. Test Statistical Analytics APIs
    console.log('\n4. Testing Statistical Analytics Suite');
    
    // KPIs
    const kpiRes = await fetch(`${baseUrl}/analytics/${datasetId}/kpis`, { headers: authHeaders });
    const kpiJson = await kpiRes.json();
    assert(kpiRes.status === 200 && kpiJson.kpis.totalRevenue > 0, `KPIs calculated (Total Revenue: $${kpiJson.kpis.totalRevenue.toLocaleString()})`);
    assert(kpiJson.kpis.activeProducts > 0, `Active Products identified (${kpiJson.kpis.activeProducts} SKUs)`);
    assert(kpiJson.kpis.grossMargin > 0, `Gross Margin computed (${kpiJson.kpis.grossMargin}%)`);

    // Seasonal Analytics
    const seasonalRes = await fetch(`${baseUrl}/analytics/${datasetId}/seasonal`, { headers: authHeaders });
    const seasonalJson = await seasonalRes.json();
    assert(seasonalRes.status === 200 && Array.isArray(seasonalJson.seasonal.breakdown), 'Seasonal breakdown computed');
    assert(!!seasonalJson.seasonal.peakSeason, `Peak season identified (${seasonalJson.seasonal.peakSeason})`);

    // Monthly & Quarterly Trends
    const trendsRes = await fetch(`${baseUrl}/analytics/${datasetId}/trends`, { headers: authHeaders });
    const trendsJson = await trendsRes.json();
    assert(trendsRes.status === 200 && trendsJson.trends.monthlyTrends.length > 0, 'Monthly trends calculated');
    assert(trendsJson.trends.quarterlyComparison.length === 4, 'Quarterly comparison (Q1-Q4) calculated');

    // Products & Inventory Risk
    const prodRes = await fetch(`${baseUrl}/analytics/${datasetId}/products`, { headers: authHeaders });
    const prodJson = await prodRes.json();
    assert(prodRes.status === 200 && prodJson.products.allProducts.length > 0, 'Product demand ranking calculated');
    assert(Array.isArray(prodJson.products.highRiskProducts), 'Inventory stockout risk monitored');

    // Categories
    const catRes = await fetch(`${baseUrl}/analytics/${datasetId}/categories`, { headers: authHeaders });
    const catJson = await catRes.json();
    assert(catRes.status === 200 && catJson.categories.categories.length > 0, 'Category performance breakdown calculated');

    // Customer Segments
    const segRes = await fetch(`${baseUrl}/analytics/${datasetId}/segments`, { headers: authHeaders });
    const segJson = await segRes.json();
    assert(segRes.status === 200 && segJson.segments.segments.length === 3, 'Customer tiers (Low, Mid, High) segmented');

    // 5. Test AI/ML Forecasting Engine
    console.log('\n5. Testing AI/ML Forecasting Engine');
    
    // Holt-Winters
    const hwRes = await fetch(`${baseUrl}/forecasting/${datasetId}/predict`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'revenue',
        targetName: 'Overall',
        algorithm: 'HOLT_WINTERS',
        horizon: 4,
        parameters: { alpha: 0.3, beta: 0.1, gamma: 0.3 },
      }),
    });
    const hwJson = await hwRes.json();
    assert(hwRes.status === 200 && hwJson.forecastPoints.length === 4, 'Holt-Winters generates 4 future projection periods');
    assert(hwJson.metrics && typeof hwJson.metrics.accuracy === 'number', `Backtesting Accuracy calculated (${hwJson.metrics.accuracy}%)`);
    assert(typeof hwJson.metrics.mape === 'number', `MAPE metric evaluated (${hwJson.metrics.mape}%)`);
    assert(typeof hwJson.metrics.rmse === 'number', `RMSE metric evaluated (${hwJson.metrics.rmse})`);
    assert(hwJson.forecastPoints[0].upper95 >= hwJson.forecastPoints[0].lower95, '95% Confidence bounds verified');

    // Moving Average
    const maRes = await fetch(`${baseUrl}/forecasting/${datasetId}/predict`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'sales',
        targetName: 'Overall',
        algorithm: 'MOVING_AVERAGE',
        horizon: 3,
        parameters: { window: 3 },
      }),
    });
    const maJson = await maRes.json();
    assert(maRes.status === 200 && maJson.forecastPoints.length === 3, 'Moving Average algorithm runs successfully');

    // Seasonal Naive
    const naiveRes = await fetch(`${baseUrl}/forecasting/${datasetId}/predict`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'revenue',
        targetName: 'Overall',
        algorithm: 'SEASONAL_NAIVE',
        horizon: 4,
        parameters: { period: 4 },
      }),
    });
    const naiveJson = await naiveRes.json();
    assert(naiveRes.status === 200 && naiveJson.forecastPoints.length === 4, 'Seasonal Naive algorithm runs successfully');

    // Anomaly Detection
    const anomRes = await fetch(`${baseUrl}/forecasting/${datasetId}/anomalies`, { headers: authHeaders });
    const anomJson = await anomRes.json();
    assert(anomRes.status === 200 && typeof anomJson.totalAnomalies === 'number', 'Statistical anomaly detection executed');

    // 6. Test AI Insights & Interactive Chat
    console.log('\n6. Testing AI Insights & Grounded Chat');
    const insRes = await fetch(`${baseUrl}/ai/${datasetId}/insights`, { headers: authHeaders });
    const insJson = await insRes.json();
    assert(insRes.status === 200 && insJson.insights.length > 0, `Structured business insights generated (${insJson.insights.length} cards)`);

    const chatRes = await fetch(`${baseUrl}/ai/${datasetId}/chat`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Is our current inventory sufficient?' }),
    });
    const chatJson = await chatRes.json();
    assert(chatRes.status === 200 && chatJson.success === true, 'AI chat responds to stock adequacy query');
    assert(chatJson.response.length > 20, 'AI response is detailed and informative');
    assert(chatJson.metrics !== null, 'AI response provides supporting metrics');

    // 7. Test Report Generation (PDF, Excel, CSV)
    console.log('\n7. Testing Report Generation Suite');
    
    // PDF
    const pdfRes = await fetch(`${baseUrl}/reports/${datasetId}/pdf`, { headers: authHeaders });
    assert(pdfRes.status === 200 && pdfRes.headers.get('content-type').includes('application/pdf'), 'PDF Report generated and streamed');

    // Excel
    const excelRes = await fetch(`${baseUrl}/reports/${datasetId}/excel`, { headers: authHeaders });
    assert(excelRes.status === 200, 'Excel Workbook generated and streamed');

    // CSV
    const csvRes = await fetch(`${baseUrl}/reports/${datasetId}/csv`, { headers: authHeaders });
    const csvText = await csvRes.text();
    assert(csvRes.status === 200 && csvText.startsWith('Product_ID,Product_Name'), 'CSV Export generated with proper headers');

    console.log(`\n========================================`);
    console.log(`📊 Test Suite Finished: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log(`========================================\n`);

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTestSuite();

