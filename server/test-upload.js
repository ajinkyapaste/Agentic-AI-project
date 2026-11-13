const fs = require('fs');
const path = require('path');
const app = require('./src/index');

const PORT = 5006;

async function testUploadFlow() {
  console.log('🧪 Testing Multi-Format Ingestion & Dynamic Column Mapping Pipeline...\n');

  const server = app.listen(PORT);

  try {
    const baseUrl = `http://localhost:${PORT}/api`;

    // 1. Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ajinkya', password: '12345678' }),
    });
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Prepare test CSV file
    const testCsvPath = path.join(__dirname, 'test_upload_sample.csv');
    const testCsvContent = [
      'Item_Code,Item_Title,Dept,Unit_Rate,Units_Sold,Total_Sales_Amt,Inventory_Qty,Weather_Period,Event_Name,Month_Name',
      'TST01,Smart Home Hub,Electronics,120.00,45,5400.00,150,Summer,Diwali,May',
      'TST02,Noise Cancelling Headphones,Audio,250.00,80,20000.00,30,Winter,Christmas,December',
      'TST03,Wireless Charger,Accessories,25.00,200,5000.00,500,Monsoon,None,July',
      'TST04,Gaming Mouse,Computing,60.00,110,6600.00,40,Summer,Eid,June',
      'TST05,Mechanical Keyboard,Computing,110.00,75,8250.00,15,Post-monsoon,Diwali,October'
    ].join('\n');
    fs.writeFileSync(testCsvPath, testCsvContent);

    // 3. Inspect Upload (Multipart)
    console.log('1. Uploading and inspecting test CSV with arbitrary header names...');
    const fileBuffer = fs.readFileSync(testCsvPath);
    const blob = new Blob([fileBuffer], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'test_upload_sample.csv');

    const inspectRes = await fetch(`${baseUrl}/datasets/inspect`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    const inspectJson = await inspectRes.json();

    if (!inspectJson.success) {
      throw new Error(`Inspect failed: ${inspectJson.message}`);
    }

    console.log(`  ✅ Inspect succeeded: ${inspectJson.rowCount} rows detected, ${inspectJson.columnCount} columns`);
    console.log(`  Suggested Mapping:`, inspectJson.suggestedMapping);

    // 4. Confirm Upload with Custom Column Mapping
    console.log('\n2. Confirming dataset with custom dynamic column mapping...');
    const customMapping = {
      productId: 'Item_Code',
      productName: 'Item_Title',
      category: 'Dept',
      price: 'Unit_Rate',
      monthlySales: 'Units_Sold',
      revenue: 'Total_Sales_Amt',
      stock: 'Inventory_Qty',
      season: 'Weather_Period',
      festival: 'Event_Name',
      month: 'Month_Name',
    };

    const confirmRes = await fetch(`${baseUrl}/datasets/confirm`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tempFileId: inspectJson.tempFileId,
        name: 'Automated Pipeline Test Dataset',
        columnMapping: customMapping,
      }),
    });
    const confirmJson = await confirmRes.json();

    if (!confirmJson.success) {
      throw new Error(`Confirm failed: ${confirmJson.message}`);
    }

    console.log(`  ✅ Dataset created with ID: ${confirmJson.dataset.id}`);
    console.log(`  Validation Report: Quality Score = ${confirmJson.dataset.validationReport.dataQualityScore}%`);
    console.log(`  Summary KPIs: Total Revenue = $${confirmJson.dataset.summaryMetrics.totalRevenue}`);

    // 5. Verify records query
    const verifyRes = await fetch(`${baseUrl}/datasets/${confirmJson.dataset.id}`, { headers: authHeaders });
    const verifyJson = await verifyRes.json();
    console.log(`  ✅ Successfully verified ${verifyJson.sampleRecords.length} stored records in database`);

    // 6. Clean up test dataset and test file
    await fetch(`${baseUrl}/datasets/${confirmJson.dataset.id}`, { method: 'DELETE', headers: authHeaders });
    console.log(`  ✅ Cleaned up test dataset`);
    if (fs.existsSync(testCsvPath)) fs.unlinkSync(testCsvPath);

    console.log('\n🎉 Dynamic Upload & Ingestion Pipeline Verified Successfully!\n');
  } catch (err) {
    console.error('Upload pipeline test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

testUploadFlow();

