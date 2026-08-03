from django.shortcuts import render
from django.http import JsonResponse
import pandas as pd
import pickle
import numpy as np
import os
from django.utils.safestring import mark_safe

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


# ✅ Load trained ML models
models = {}
for cat in datasets.keys():
    rev_path = os.path.join(MODEL_DIR, f"{cat}_revenue.pkl")
    tier_path = os.path.join(MODEL_DIR, f"{cat}_tier.pkl")
    with open(rev_path, "rb") as f1, open(tier_path, "rb") as f2:
        models[cat] = {
            "revenue": pickle.load(f1),
            "tier": pickle.load(f2)
        }

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
        message = request.POST.get("message", "")

        if not category or not product:
            return JsonResponse({"response": "❌ Category and product must be selected."})

        cat_key = category.lower()
        df = datasets.get(cat_key)
        if df is None or product not in df["Product_Name"].values:
            return JsonResponse({"response": "❌ Product not found in dataset."})

        prod = df[df["Product_Name"] == product].iloc[0]

        # Extract key fields safely
        sales = float(prod.get("Monthly_Sales", 0))
        stock = float(prod.get("Stock", 0))
        revenue = float(prod.get("Revenue", 0))
        season = prod.get("Season", "N/A")
        festival = prod.get("Festival", "N/A")

        # --- Predict future revenue
        reg = models[cat_key]["revenue"]
        X_reg = pd.DataFrame([[sales, stock]], columns=["Monthly_Sales", "Stock"])
        future_rev = float(reg.predict(X_reg)[0])

        # --- Predict product tier
        cls = models[cat_key]["tier"]
        X_cls = pd.DataFrame([[sales, stock, revenue]], columns=["Monthly_Sales", "Stock", "Revenue"])
        tier = cls.predict(X_cls)[0]

        # --- Stock condition logic
        stock_status = (
            "🟢 Sufficient" if stock > sales * 3
            else "🟠 Moderate" if stock > sales
            else "🔴 Low"
        )

        # --- Revenue growth forecast
        growth = round(((future_rev - revenue) / revenue) * 100, 2) if revenue else 0
        trend = (
            "📈 Rising" if growth > 5
            else "📊 Stable" if growth > -5
            else "📉 Declining"
        )

        # --- Structured HTML Response
        html_response = mark_safe(f"""
        <div style="background:#f9f9f9;padding:16px;border-radius:10px;line-height:1.6;">
            <h3>🎯 Festival/Season Sales Prediction</h3>
            <p>Best season: <b>{season}</b> | Festival: <b>{festival}</b></p>

            <h3>📦 Stock & Inventory Insight</h3>
            <p>Current stock: <b>{stock}</b> units ({stock_status})<br>
            Avg monthly sales: <b>{sales}</b></p>

            <h3>🧍‍♂️ Customer Segmentation</h3>
            <p>Product classified as: <b>{tier}</b> value product.</p>

            <h3>💰 Revenue & Growth Forecast</h3>
            <p>Current revenue: <b>{revenue:,.2f}</b><br>
            Predicted next month revenue: <b>{future_rev:,.2f}</b><br>
            Growth: <b>{growth}%</b> ({trend})</p>

            <h3>🌍 Future Market Trend</h3>
            <p>Based on current performance and seasonal patterns, this product is expected to perform <b>{trend}</b> in the coming months.</p>

            <h3>✍️ Recommendation</h3>
            <ul>
                <li>Plan promotions around <b>{festival}</b> and <b>{season}</b> season.</li>
                <li>Maintain inventory level to meet ~3 months demand.</li>
                <li>Target marketing towards <b>{tier}</b> value customers.</li>
                <li>Monitor weekly sales to adjust forecast dynamically.</li>
            </ul>
        </div>
        """)

        return JsonResponse({"response": html_response})

    return JsonResponse({"error": "Invalid request method"}, status=400)
