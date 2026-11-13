/**
 * Comprehensive Statistical Analytics Service
 * Computes Overall KPIs, Seasonal Analytics, Product Demand Ranking,
 * Monthly/Quarterly Comparisons, Category/Region Share, Customer Segmentation,
 * and Financial Profit/Margin Breakdown.
 */

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * 1. Overall Executive Sales KPIs
 */
function getExecutiveKpis(records) {
  if (!records || !records.length) {
    return {
      totalRevenue: 0,
      totalUnits: 0,
      totalCost: 0,
      grossProfit: 0,
      grossMargin: 0,
      avgOrderValue: 0,
      activeProducts: 0,
      activeCategories: 0,
      topCategory: 'None',
      topProduct: 'None',
      growthRate: 0,
    };
  }

  const totalRevenue = records.reduce((sum, r) => sum + (r.revenue || 0), 0);
  const totalUnits = records.reduce((sum, r) => sum + (r.monthlySales || 0), 0);
  const totalCost = records.reduce((sum, r) => sum + (r.cost * r.monthlySales || r.cost || 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? +((grossProfit / totalRevenue) * 100).toFixed(2) : 0;
  const avgOrderValue = totalUnits > 0 ? +(totalRevenue / totalUnits).toFixed(2) : 0;

  const productSet = new Set(records.map((r) => r.productName));
  const categorySet = new Set(records.map((r) => r.category));

  // Category revenue totals
  const catTotals = {};
  records.forEach((r) => {
    catTotals[r.category] = (catTotals[r.category] || 0) + (r.revenue || 0);
  });
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Product revenue totals
  const prodTotals = {};
  records.forEach((r) => {
    prodTotals[r.productName] = (prodTotals[r.productName] || 0) + (r.revenue || 0);
  });
  const topProduct = Object.entries(prodTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Average projected growth rate from dataset
  const growthList = records.map((r) => r.predictedGrowth).filter((g) => typeof g === 'number' && !isNaN(g));
  const avgGrowth = growthList.length
    ? +(growthList.reduce((a, b) => a + b, 0) / growthList.length).toFixed(2)
    : 0;

  return {
    totalRevenue: +totalRevenue.toFixed(2),
    totalUnits,
    totalCost: +totalCost.toFixed(2),
    grossProfit: +grossProfit.toFixed(2),
    grossMargin,
    avgOrderValue,
    activeProducts: productSet.size,
    activeCategories: categorySet.size,
    topCategory,
    topProduct,
    growthRate: avgGrowth,
  };
}

/**
 * 2. Seasonal Analytics (Summer, Monsoon, Winter, Post-monsoon, All Season)
 */
function getSeasonalAnalytics(records) {
  const SEASONS = ['Summer', 'Monsoon', 'Post-monsoon', 'Winter', 'All Season'];
  const seasonStats = {};

  SEASONS.forEach((s) => {
    seasonStats[s] = {
      season: s,
      revenue: 0,
      units: 0,
      recordCount: 0,
      festivals: new Set(),
      categories: new Set(),
      profit: 0,
    };
  });

  let overallRevenue = 0;
  records.forEach((r) => {
    const s = r.season || 'All Season';
    if (!seasonStats[s]) {
      seasonStats[s] = {
        season: s,
        revenue: 0,
        units: 0,
        recordCount: 0,
        festivals: new Set(),
        categories: new Set(),
        profit: 0,
      };
    }
    seasonStats[s].revenue += r.revenue || 0;
    seasonStats[s].units += r.monthlySales || 0;
    seasonStats[s].profit += r.profit || (r.revenue - (r.cost * r.monthlySales) || 0);
    seasonStats[s].recordCount += 1;
    if (r.festival && r.festival !== 'None' && r.festival !== '–') {
      seasonStats[s].festivals.add(r.festival);
    }
    seasonStats[s].categories.add(r.category);
    overallRevenue += r.revenue || 0;
  });

  const avgSeasonRevenue = overallRevenue / Object.keys(seasonStats).length;

  const seasonalBreakdown = Object.values(seasonStats).map((st) => {
    const seasonalIndex = avgSeasonRevenue > 0 ? +((st.revenue / avgSeasonRevenue) * 100).toFixed(1) : 100;
    const margin = st.revenue > 0 ? +((st.profit / st.revenue) * 100).toFixed(2) : 0;
    const revenueShare = overallRevenue > 0 ? +((st.revenue / overallRevenue) * 100).toFixed(2) : 0;

    return {
      season: st.season,
      revenue: +st.revenue.toFixed(2),
      units: st.units,
      profit: +st.profit.toFixed(2),
      margin,
      revenueShare,
      seasonalIndex,
      recordCount: st.recordCount,
      peakFestivals: Array.from(st.festivals).slice(0, 3),
      contributingCategories: st.categories.size,
    };
  });

  // Find Peak Season
  const peakSeason = [...seasonalBreakdown].sort((a, b) => b.revenue - a.revenue)[0];

  return {
    breakdown: seasonalBreakdown,
    peakSeason: peakSeason?.season || 'Summer',
    peakSeasonRevenue: peakSeason?.revenue || 0,
    peakSeasonShare: peakSeason?.revenueShare || 0,
  };
}

/**
 * 3. Monthly & Quarterly Revenue/Sales Trends
 */
function getTimeTrends(records) {
  // Aggregate by Month
  const monthMap = {};
  records.forEach((r) => {
    const m = r.month || 'Other';
    if (!monthMap[m]) {
      monthMap[m] = { month: m, revenue: 0, units: 0, profit: 0, count: 0 };
    }
    monthMap[m].revenue += r.revenue || 0;
    monthMap[m].units += r.monthlySales || 0;
    monthMap[m].profit += r.profit || (r.revenue - (r.cost * r.monthlySales) || 0);
    monthMap[m].count++;
  });

  // Sort chronologically if standard calendar months
  const monthlyTrends = Object.values(monthMap).sort((a, b) => {
    const idxA = MONTH_ORDER.indexOf(a.month);
    const idxB = MONTH_ORDER.indexOf(b.month);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.month.localeCompare(b.month);
  }).map((m, idx, arr) => {
    const prevRev = idx > 0 ? arr[idx - 1].revenue : m.revenue;
    const momGrowth = prevRev > 0 ? +(((m.revenue - prevRev) / prevRev) * 100).toFixed(2) : 0;
    return {
      ...m,
      revenue: +m.revenue.toFixed(2),
      profit: +m.profit.toFixed(2),
      margin: m.revenue > 0 ? +((m.profit / m.revenue) * 100).toFixed(2) : 0,
      momGrowth,
    };
  });

  // Aggregate by Quarter
  const quarterMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  const quarterProfit = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  const quarterUnits = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

  records.forEach((r) => {
    const q = r.quarter || 'Q1';
    quarterMap[q] = (quarterMap[q] || 0) + (r.revenue || 0);
    quarterProfit[q] = (quarterProfit[q] || 0) + (r.profit || 0);
    quarterUnits[q] = (quarterUnits[q] || 0) + (r.monthlySales || 0);
  });

  const quarterlyComparison = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
    const rev = quarterMap[q] || 0;
    const prof = quarterProfit[q] || 0;
    return {
      quarter: q,
      revenue: +rev.toFixed(2),
      profit: +prof.toFixed(2),
      units: quarterUnits[q] || 0,
      margin: rev > 0 ? +((prof / rev) * 100).toFixed(2) : 0,
    };
  });

  return { monthlyTrends, quarterlyComparison };
}

/**
 * 4. Product-Wise Demand & Inventory Risk Matrix
 */
function getProductAnalytics(records) {
  const prodMap = {};

  records.forEach((r) => {
    const name = r.productName;
    if (!prodMap[name]) {
      prodMap[name] = {
        productId: r.productId,
        productName: name,
        category: r.category,
        totalRevenue: 0,
        totalSales: 0,
        avgPrice: 0,
        currentStock: r.stock || 0,
        prices: [],
        margin: r.marginPercentage || 0,
        season: r.season,
        customerSegment: r.customerSegment,
        predictedGrowth: r.predictedGrowth || 0,
        count: 0,
      };
    }
    prodMap[name].totalRevenue += r.revenue || 0;
    prodMap[name].totalSales += r.monthlySales || 0;
    prodMap[name].prices.push(r.price || 0);
    prodMap[name].count++;
  });

  const productList = Object.values(prodMap).map((p) => {
    const avgPrice = p.prices.length ? +(p.prices.reduce((a, b) => a + b, 0) / p.prices.length).toFixed(2) : 0;
    const avgMonthlySales = +(p.totalSales / p.count).toFixed(1);
    
    // Stock condition heuristics
    const stockRatio = avgMonthlySales > 0 ? +(p.currentStock / avgMonthlySales).toFixed(2) : 99;
    let stockStatus = 'Sufficient';
    let riskLevel = 'LOW';
    if (stockRatio < 1.0) {
      stockStatus = 'Low (Risk of Stockout)';
      riskLevel = 'HIGH';
    } else if (stockRatio < 3.0) {
      stockStatus = 'Moderate';
      riskLevel = 'MEDIUM';
    }

    const reorderRecommendation = riskLevel === 'HIGH'
      ? Math.ceil(avgMonthlySales * 3 - p.currentStock)
      : 0;

    return {
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      totalRevenue: +p.totalRevenue.toFixed(2),
      totalSales: p.totalSales,
      avgMonthlySales,
      avgPrice,
      currentStock: p.currentStock,
      stockRatio,
      stockStatus,
      riskLevel,
      reorderRecommendation,
      margin: p.margin,
      season: p.season,
      customerSegment: p.customerSegment,
      predictedGrowth: p.predictedGrowth,
    };
  });

  // Top products by revenue
  const topProducts = [...productList].sort((a, b) => b.totalRevenue - a.totalRevenue);

  // High stockout risk products
  const highRiskProducts = productList.filter((p) => p.riskLevel === 'HIGH');

  return {
    allProducts: topProducts,
    topByRevenue: topProducts.slice(0, 10),
    topByUnits: [...productList].sort((a, b) => b.totalSales - a.totalSales).slice(0, 10),
    highRiskProducts,
  };
}

/**
 * 5. Category-Wise Analytics & Market Share
 */
function getCategoryAnalytics(records) {
  const catMap = {};
  let totalRevenue = 0;

  records.forEach((r) => {
    const c = r.category || 'General';
    if (!catMap[c]) {
      catMap[c] = {
        category: c,
        revenue: 0,
        units: 0,
        profit: 0,
        productSet: new Set(),
      };
    }
    catMap[c].revenue += r.revenue || 0;
    catMap[c].units += r.monthlySales || 0;
    catMap[c].profit += r.profit || (r.revenue - (r.cost * r.monthlySales) || 0);
    catMap[c].productSet.add(r.productName);
    totalRevenue += r.revenue || 0;
  });

  const categories = Object.values(catMap).map((cat) => {
    const share = totalRevenue > 0 ? +((cat.revenue / totalRevenue) * 100).toFixed(2) : 0;
    const margin = cat.revenue > 0 ? +((cat.profit / cat.revenue) * 100).toFixed(2) : 0;
    return {
      category: cat.category,
      revenue: +cat.revenue.toFixed(2),
      units: cat.units,
      profit: +cat.profit.toFixed(2),
      margin,
      marketShare: share,
      productCount: cat.productSet.size,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return { categories, totalRevenue: +totalRevenue.toFixed(2) };
}

/**
 * 6. Region-Wise Geographic Demand Distribution
 */
function getRegionAnalytics(records) {
  const regionMap = {};
  let totalRevenue = 0;

  records.forEach((r) => {
    const reg = r.region || 'Global';
    if (!regionMap[reg]) {
      regionMap[reg] = { region: reg, revenue: 0, units: 0, products: new Set() };
    }
    regionMap[reg].revenue += r.revenue || 0;
    regionMap[reg].units += r.monthlySales || 0;
    regionMap[reg].products.add(r.productName);
    totalRevenue += r.revenue || 0;
  });

  const regions = Object.values(regionMap).map((rg) => ({
    region: rg.region,
    revenue: +rg.revenue.toFixed(2),
    units: rg.units,
    productCount: rg.products.size,
    share: totalRevenue > 0 ? +((rg.revenue / totalRevenue) * 100).toFixed(2) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return { regions, totalRevenue: +totalRevenue.toFixed(2) };
}

/**
 * 7. Customer Purchasing Behavior & Segmentation
 */
function getCustomerSegmentAnalytics(records) {
  const segmentMap = {
    low: { tier: 'Budget (Low)', revenue: 0, units: 0, transactions: 0, totalSpend: 0 },
    mid: { tier: 'Standard (Mid)', revenue: 0, units: 0, transactions: 0, totalSpend: 0 },
    high: { tier: 'Premium (High)', revenue: 0, units: 0, transactions: 0, totalSpend: 0 },
  };

  let totalRev = 0;
  records.forEach((r) => {
    const rawSeg = String(r.customerSegment || 'mid').toLowerCase();
    const segKey = segmentMap[rawSeg] ? rawSeg : 'mid';

    segmentMap[segKey].revenue += r.revenue || 0;
    segmentMap[segKey].units += r.monthlySales || 0;
    segmentMap[segKey].transactions += 1;
    segmentMap[segKey].totalSpend += r.price || 0;
    totalRev += r.revenue || 0;
  });

  const segments = Object.entries(segmentMap).map(([key, data]) => {
    const revenueShare = totalRev > 0 ? +((data.revenue / totalRev) * 100).toFixed(2) : 0;
    const avgTicket = data.transactions > 0 ? +(data.revenue / data.transactions).toFixed(2) : 0;
    const avgPrice = data.transactions > 0 ? +(data.totalSpend / data.transactions).toFixed(2) : 0;

    return {
      segmentKey: key,
      segmentName: data.tier,
      revenue: +data.revenue.toFixed(2),
      units: data.units,
      transactions: data.transactions,
      revenueShare,
      avgTicket,
      avgPrice,
      persona: key === 'high'
        ? 'Enterprise & high-net-worth buyers prioritizing premium quality and performance'
        : key === 'mid'
        ? 'Mass-market balanced buyers seeking high utility and value-for-money'
        : 'Price-sensitive consumers responding primarily to discounts and promotions',
    };
  });

  return { segments };
}

module.exports = {
  getExecutiveKpis,
  getSeasonalAnalytics,
  getTimeTrends,
  getProductAnalytics,
  getCategoryAnalytics,
  getRegionAnalytics,
  getCustomerSegmentAnalytics,
};

