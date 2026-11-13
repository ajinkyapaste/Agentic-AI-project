/**
 * Data Validator & Dynamic Column Mapping Service
 * Handles CSV/XLS/XLSX column inference, canonical mapping, cleaning, and validation.
 */

const CANONICAL_FIELDS = {
  productId: {
    label: 'Product ID',
    type: 'string',
    aliases: ['product_id', 'productid', 'id', 'sku', 'code', 'item_id'],
    default: (row, idx) => `PRD-${1000 + (typeof idx === 'number' ? idx : 0)}`,
  },
  productName: {
    label: 'Product Name',
    type: 'string',
    required: true,
    aliases: ['product_name', 'product', 'item', 'item_name', 'name', 'title'],
    default: (row, idx) => `Product ${(typeof idx === 'number' ? idx : 0) + 1}`,
  },
  category: {
    label: 'Category',
    type: 'string',
    required: true,
    aliases: ['category', 'cat', 'department', 'dept', 'group', 'product_category'],
    default: () => 'General',
  },
  region: {
    label: 'Region',
    type: 'string',
    aliases: ['region', 'zone', 'territory', 'location', 'country', 'city', 'state'],
    default: () => 'Global',
  },
  price: {
    label: 'Unit Price',
    type: 'number',
    aliases: ['price', 'unit_price', 'rate', 'selling_price', 'mrp'],
    default: () => 0,
  },
  cost: {
    label: 'Unit Cost',
    type: 'number',
    aliases: ['cost', 'unit_cost', 'cost_price', 'cogs', 'expense'],
    default: (row) => (row.price ? +(row.price * 0.65).toFixed(2) : 0),
  },
  stock: {
    label: 'Current Stock',
    type: 'number',
    aliases: ['stock', 'inventory', 'current_stock', 'units_available', 'qty_in_stock'],
    default: () => 0,
  },
  monthlySales: {
    label: 'Monthly Sales (Units)',
    type: 'number',
    required: true,
    aliases: ['monthly_sales', 'sales', 'units_sold', 'units', 'qty', 'quantity', 'volume'],
    default: () => 0,
  },
  revenue: {
    label: 'Revenue ($)',
    type: 'number',
    required: true,
    aliases: ['revenue', 'total_revenue', 'sales_amount', 'amount', 'turnover', 'total'],
    default: (row) => +(row.monthlySales * row.price).toFixed(2) || 0,
  },
  customerSegment: {
    label: 'Customer Segment',
    type: 'string',
    aliases: ['customer_segment', 'segment', 'customer_tier', 'tier', 'buyer_group'],
    default: (row) => {
      if (row.revenue > 100000) return 'high';
      if (row.revenue > 20000) return 'mid';
      return 'low';
    },
  },
  season: {
    label: 'Season',
    type: 'string',
    aliases: ['season', 'weather_season', 'quarter_season'],
    default: (row) => {
      const month = String(row.month || '').toLowerCase();
      if (['march', 'april', 'may'].includes(month)) return 'Summer';
      if (['june', 'july', 'august', 'september'].includes(month)) return 'Monsoon';
      if (['october', 'november'].includes(month)) return 'Post-monsoon';
      if (['december', 'january', 'february'].includes(month)) return 'Winter';
      return 'All Season';
    },
  },
  festival: {
    label: 'Festival / Peak Event',
    type: 'string',
    aliases: ['festival', 'holiday', 'event', 'campaign', 'peak_event'],
    default: () => 'None',
  },
  marketTrendScore: {
    label: 'Market Trend Score (1-10)',
    type: 'number',
    aliases: ['market_trend_score', 'trend_score', 'trend', 'rating', 'score'],
    default: () => 5,
  },
  predictedGrowth: {
    label: 'Predicted Growth %',
    type: 'number',
    aliases: ['predicted_growth_%', 'growth_rate', 'projected_growth', 'growth', 'predicted_growth'],
    default: () => 0,
  },
  month: {
    label: 'Month',
    type: 'string',
    aliases: ['month', 'sales_month', 'period', 'date_month'],
    default: () => 'January',
  },
  date: {
    label: 'Date',
    type: 'date',
    aliases: ['date', 'sale_date', 'transaction_date', 'order_date', 'timestamp'],
    default: () => null,
  },
};

/**
 * Infer data type of raw column values
 */
function inferDataType(values) {
  const nonNull = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  if (!nonNull.length) return 'string';

  let numericCount = 0;
  let dateCount = 0;

  for (const v of nonNull.slice(0, 50)) {
    const s = String(v).trim().replace(/[\$,]/g, '');
    if (!isNaN(Number(s))) {
      numericCount++;
    } else if (!isNaN(Date.parse(s)) && s.length >= 8) {
      dateCount++;
    }
  }

  const sampleSize = Math.min(nonNull.length, 50);
  if (numericCount / sampleSize > 0.8) return 'number';
  if (dateCount / sampleSize > 0.8) return 'date';
  return 'string';
}

/**
 * Analyze raw records: identify columns, types, sample values, and suggest mapping
 */
function inspectRawDataset(rawRows) {
  if (!rawRows || !rawRows.length) {
    throw new Error('Dataset is empty or contains no valid rows.');
  }

  const columns = Object.keys(rawRows[0]);
  const detectedColumns = [];
  const suggestedMapping = {};

  columns.forEach((col) => {
    const values = rawRows.map((r) => r[col]);
    const inferredType = inferDataType(values);
    const nonNullCount = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length;
    const missingCount = rawRows.length - nonNullCount;

    detectedColumns.push({
      name: col,
      inferredType,
      sampleValues: values.slice(0, 3),
      missingCount,
      missingPercentage: +((missingCount / rawRows.length) * 100).toFixed(1),
    });

    // Auto-map column by alias matching
    const normalizedCol = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
    for (const [canonKey, def] of Object.entries(CANONICAL_FIELDS)) {
      if (
        canonKey.toLowerCase() === normalizedCol ||
        def.aliases.includes(normalizedCol) ||
        def.aliases.some((alias) => normalizedCol.includes(alias))
      ) {
        if (!suggestedMapping[canonKey]) {
          suggestedMapping[canonKey] = col;
        }
      }
    }
  });

  return {
    rowCount: rawRows.length,
    columnCount: columns.length,
    detectedColumns,
    suggestedMapping,
    canonicalDefinitions: CANONICAL_FIELDS,
  };
}

/**
 * Clean, map, and validate raw rows into canonical schema
 */
function cleanAndValidateDataset(rawRows, columnMapping = {}) {
  const missingByField = {};
  let duplicateCount = 0;
  let invalidValueCount = 0;
  const seenSignatures = new Set();
  const cleanedRecords = [];

  const MONTH_MAP = {
    1: 'January', 2: 'February', 3: 'March', 4: 'April',
    5: 'May', 6: 'June', 7: 'July', 8: 'August',
    9: 'September', 10: 'October', 11: 'November', 12: 'December',
  };

  const QUARTER_MAP = {
    january: 'Q1', february: 'Q1', march: 'Q1',
    april: 'Q2', may: 'Q2', june: 'Q2',
    july: 'Q3', august: 'Q3', september: 'Q3',
    october: 'Q4', november: 'Q4', december: 'Q4',
  };

  rawRows.forEach((row, idx) => {
    const mapped = {};

    // 1. Map columns using the mapping dict or direct lookup
    for (const [canonKey, def] of Object.entries(CANONICAL_FIELDS)) {
      const sourceCol = columnMapping[canonKey] || canonKey;
      let val = row[sourceCol];

      if (val === undefined || val === null || String(val).trim() === '') {
        missingByField[canonKey] = (missingByField[canonKey] || 0) + 1;
        // Apply default value / function
        val = typeof def.default === 'function' ? def.default(mapped, idx) : def.default;
      } else if (def.type === 'number') {
        const cleanedNum = Number(String(val).replace(/[\$,]/g, '').trim());
        if (isNaN(cleanedNum)) {
          invalidValueCount++;
          val = typeof def.default === 'function' ? def.default(mapped, idx) : def.default;
        } else {
          val = cleanedNum;
        }
      } else if (def.type === 'date') {
        const parsedDate = new Date(val);
        val = isNaN(parsedDate.getTime()) ? null : parsedDate;
      } else {
        val = String(val).trim();
      }

      mapped[canonKey] = val;
    }

    // 2. Validate essential calculations (Cost, Profit, Margin, Quarter)
    if (!mapped.cost || mapped.cost <= 0) {
      mapped.cost = +(mapped.price * 0.65).toFixed(2);
    }
    const totalCost = +(mapped.cost * mapped.monthlySales).toFixed(2);
    mapped.profit = +(mapped.revenue - totalCost).toFixed(2);
    mapped.marginPercentage = mapped.revenue > 0 
      ? +(((mapped.profit) / mapped.revenue) * 100).toFixed(2) 
      : 0;

    // Normalize Month & Quarter
    const mStr = String(mapped.month || '').toLowerCase();
    mapped.quarter = QUARTER_MAP[mStr] || 'Q1';

    // Normalize Season
    if (!mapped.season || mapped.season === 'N/A' || mapped.season === '–') {
      mapped.season = CANONICAL_FIELDS.season.default(mapped);
    }

    // 3. Duplicate check based on (productName, month, category, region)
    const sig = `${mapped.productName}__${mapped.month}__${mapped.category}__${mapped.region}`.toLowerCase();
    if (seenSignatures.has(sig)) {
      duplicateCount++;
    } else {
      seenSignatures.add(sig);
    }

    cleanedRecords.push(mapped);
  });

  // Calculate high-level summary KPIs
  const totalRevenue = cleanedRecords.reduce((acc, r) => acc + (r.revenue || 0), 0);
  const totalUnits = cleanedRecords.reduce((acc, r) => acc + (r.monthlySales || 0), 0);
  const avgMargin = cleanedRecords.length
    ? +(cleanedRecords.reduce((acc, r) => acc + (r.marginPercentage || 0), 0) / cleanedRecords.length).toFixed(2)
    : 0;
  const uniqueProducts = new Set(cleanedRecords.map((r) => r.productName)).size;
  const uniqueCategories = new Set(cleanedRecords.map((r) => r.category)).size;

  const validationReport = {
    totalRawRows: rawRows.length,
    validRecords: cleanedRecords.length,
    duplicateCount,
    invalidValueCount,
    missingValues: missingByField,
    dataQualityScore: Math.max(
      0,
      100 - (duplicateCount * 2 + invalidValueCount * 3 + Object.values(missingByField).reduce((a, b) => a + b, 0)) / rawRows.length
    ).toFixed(1),
  };

  const summaryMetrics = {
    totalRevenue: +totalRevenue.toFixed(2),
    totalUnits,
    avgMargin,
    uniqueProducts,
    uniqueCategories,
    avgOrderValue: totalUnits > 0 ? +(totalRevenue / totalUnits).toFixed(2) : 0,
  };

  return {
    cleanedRecords,
    validationReport,
    summaryMetrics,
  };
}

module.exports = {
  CANONICAL_FIELDS,
  inspectRawDataset,
  cleanAndValidateDataset,
};

