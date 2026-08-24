from django.shortcuts import render
from django.http import JsonResponse
import pandas as pd
import pickle
import numpy as np
import os
import warnings
from django.utils.safestring import mark_safe

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ✅ Relative dataset paths
DATA_PATHS = {
    "electronics": os.path.join(BASE_DIR, "electronics.csv"),
    "groceries": os.path.join(BASE_DIR, "groceries.csv"),
    "cosmetics": os.path.join(BASE_DIR, "cosmetics.csv"),
    "medicines": os.path.join(BASE_DIR, "medicines.csv"),
    "cars": os.path.join(BASE_DIR, "cars.csv"),
}

# ✅ Load datasets
datasets = {cat: pd.read_csv(path) for cat, path in DATA_PATHS.items()}
# ✅ Model directory (same directory)
MODEL_DIR = BASE_DIR

# ✅ Lazy load trained ML models
models_cache = {}

def get_model(cat):
    if cat not in models_cache:
        rev_path = os.path.join(MODEL_DIR, f"{cat}_revenue.pkl")
        tier_path = os.path.join(MODEL_DIR, f"{cat}_tier.pkl")
        if os.path.exists(rev_path) and os.path.exists(tier_path):
            with open(rev_path, "rb") as f1, open(tier_path, "rb") as f2:
                models_cache[cat] = {
                    "revenue": pickle.load(f1),
                    "tier": pickle.load(f2)
                }
    return models_cache.get(cat)


# ✅ Home Page
def index(request):
    categories = list(datasets.keys())
    return render(request, "index.html", {"categories": categories})

# ✅ Get products for a selected category
def get_products(request, category):
    df = datasets.get(category.lower())
    if df is not None and "Product_Name" in df.columns:
        return JsonResponse({"products": df["Product_Name"].unique().tolist()})
    return JsonResponse({"error": "Category not found"}, status=404)

from django.views.decorators.csrf import csrf_exempt

# ✅ ML-based Chat Logic
@csrf_exempt
def chat_with_ai(request):
    if request.method == "POST":
        category = request.POST.get("category", "")
        product = request.POST.get("product", "")
        message = request.POST.get("message", "").strip().lower()

        if not category or not product:
            return JsonResponse({"success": False, "response": "❌ Category and product must be selected."})

        cat_key = category.lower()
        df = datasets.get(cat_key)
        if df is None or product not in df["Product_Name"].values:
            return JsonResponse({"success": False, "response": "❌ Product not found in dataset."})

        prod = df[df["Product_Name"] == product].iloc[0]

        # Extract key fields safely
        sales = float(prod.get("Monthly_Sales", 0))
        stock = float(prod.get("Stock", 0))
        revenue = float(prod.get("Revenue", 0))
        season = prod.get("Season", "N/A")
        festival = prod.get("Festival", "N/A")

        cat_models = get_model(cat_key)
        if not cat_models:
            return JsonResponse({"success": False, "response": "❌ ML Models for this category could not be loaded."})

        # --- Predict future revenue
        reg = cat_models["revenue"]
        X_reg = pd.DataFrame([[sales, stock]], columns=["Monthly_Sales", "Stock"])
        future_rev = float(reg.predict(X_reg)[0])

        # --- Predict product tier
        cls = cat_models["tier"]
        X_cls = pd.DataFrame([[sales, stock, revenue]], columns=["Monthly_Sales", "Stock", "Revenue"])
        tier = cls.predict(X_cls)[0]

        # --- Stock condition logic
        stock_status = (
            "Sufficient" if stock > sales * 3
            else "Moderate" if stock > sales
            else "Low"
        )
        stock_status_icon = (
            "🟢 Sufficient" if stock_status == "Sufficient"
            else "🟠 Moderate" if stock_status == "Moderate"
            else "🔴 Low"
        )

        # --- Revenue growth forecast
        growth = round(((future_rev - revenue) / revenue) * 100, 2) if revenue else 0
        trend = (
            "Rising" if growth > 5
            else "Stable" if growth > -5
            else "Declining"
        )
        trend_icon = (
            "📈 Rising" if trend == "Rising"
            else "📊 Stable" if trend == "Stable"
            else "📉 Declining"
        )

        # --- Fetch historical data for this product across different months
        month_order = {
            "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
            "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
        }
        prod_rows = df[df["Product_Name"] == product].copy()
        if "Month" in prod_rows.columns:
            prod_rows["Month_Num"] = prod_rows["Month"].map(month_order).fillna(13)
            prod_rows = prod_rows.sort_values("Month_Num")

        history = []
        for _, row in prod_rows.iterrows():
            history.append({
                "month": row.get("Month", "N/A"),
                "sales": float(row.get("Monthly_Sales", 0)),
                "revenue": float(row.get("Revenue", 0)),
                "stock": float(row.get("Stock", 0))
            })

        # --- Determine dynamic response based on user message (Rule-based NLP)
        if not message:
            ai_response = f"Hello! I've loaded the predictive dashboard for **{product}**. I've projected a **{growth}%** ({trend_icon}) revenue change for next month. You can check the graphs or ask me specific questions about its stock, revenue, seasonal peaks, or consumer segment!"
        elif any(k in message for k in ["stock", "inventory", "units", "quantity"]):
            ai_response = f"Regarding **{product}**'s inventory: the current stock level is **{stock:,.0f} units**, which is classified as **{stock_status_icon}** compared to average monthly sales of **{sales:,.0f}**. Recommendation: Maintain inventory at ~3x monthly sales to avoid stockouts."
        elif any(k in message for k in ["revenue", "sales", "forecast", "prediction", "growth", "next month", "earn"]):
            ai_response = f"My regression model predicts next month's revenue for **{product}** will be **${future_rev:,.2f}** (a **{growth}%** change, trending **{trend_icon}**), compared to the current month's revenue of **${revenue:,.2f}**."
        elif any(k in message for k in ["season", "festival", "peak", "diwali", "christmas", "eid", "when"]):
            ai_response = f"**{product}** sees peak performance in the **{season}** season. Our seasonal tracking indicates **{festival}** is the primary festival event. I suggest starting targeted promotional campaigns at least 3 weeks before."
        elif any(k in message for k in ["tier", "segment", "customer", "value"]):
            ai_response = f"Based on historical revenue contribution, customer classification models have placed **{product}** in the **{tier.upper()}** value tier. This category appeals to buyers focused on { 'high premium value' if tier.lower() == 'high' else 'mid-market balance' if tier.lower() == 'mid' else 'budget-friendly pricing' }."
        elif any(k in message for k in ["hi", "hello", "hey", "who are you", "help", "greet"]):
            ai_response = f"Hello! I am your AI Sales Assistant. Ask me questions like: \n- *'Is our stock sufficient?'*\n- *'What is next month's revenue forecast?'*\n- *'What customer segment buys this?'*\n- *'When is the peak sales season?'*"
        else:
            ai_response = f"Concerning **{product}**: current sales are **{sales:,.0f}** units generating **${revenue:,.2f}** revenue. Next month's revenue is forecast at **${future_rev:,.2f}** ({trend_icon}). Stock level is **{stock}** ({stock_status}). Best sold in **{season}** during **{festival}**. What specific aspect would you like to dive deeper into?"

        return JsonResponse({
            "success": True,
            "response": ai_response,
            "metrics": {
                "sales": sales,
                "stock": stock,
                "revenue": revenue,
                "season": season,
                "festival": festival,
                "future_revenue": future_rev,
                "tier": tier,
                "stock_status": stock_status,
                "growth": growth,
                "trend": trend,
                "product_name": product,
                "category": category
            },
            "history": history
        })

    return JsonResponse({"error": "Invalid request method"}, status=400)

