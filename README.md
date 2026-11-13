# 🚀 Sales Intelligence & AI-Powered Predictive Analytics Platform

> **Production-Ready Enterprise Sales Analytics, Time-Series Forecasting, and Multi-Format Ingestion Platform** built with **React (Vite)**, **Node.js (Express)**, **PostgreSQL (Prisma ORM)**, and **Statistical AI/ML Algorithms**.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Capabilities & Modules](#-key-capabilities--modules)
3. [Technology Stack](#-technology-stack)
4. [System Architecture & Workflow](#-system-architecture--workflow)
5. [Complete Folder Structure](#-complete-folder-structure)
6. [Prerequisites & Quickstart](#-prerequisites--quickstart)
7. [Environment Variable Configuration](#-environment-variable-configuration)
8. [Admin Initialization & Authentication](#-admin-initialization--authentication)
9. [PostgreSQL & Prisma Database Setup](#-postgresql--prisma-database-setup)
10. [AI/ML Forecasting Engine & Mathematical Formulations](#-aiml-forecasting-engine--mathematical-formulations)
11. [REST API Documentation & Contracts](#-rest-api-documentation--contracts)
12. [Dataset Ingestion & Dynamic Mapping Guide](#-dataset-ingestion--dynamic-mapping-guide)
13. [Testing & Verification Guide](#-testing--verification-guide)
14. [Deployment & Troubleshooting](#-deployment--troubleshooting)

---

## 🌟 Project Overview
The **Sales Intelligence & AI Analytics Platform** transforms raw, multi-format operational data (CSV, XLS, XLSX) into evidence-based business intelligence, time-series revenue/demand forecasts, and actionable inventory recommendations.

Unlike hardcoded analytics dashboards, all metrics, seasonal indices, stockout warnings, and conversational responses are dynamically computed from underlying database records without hallucinations or static mock values.

---

## 🎯 Key Capabilities & Modules

### 1. Multi-Format Dataset Ingestion & Dynamic Column Mapper
- **Multi-Format Support**: Upload `.csv`, `.xls`, and `.xlsx` files seamlessly up to 25MB.
- **Automated Schema Inference**: Automatic detection of column types (`number`, `string`, `date`) and sample value inspection.
- **Dynamic Column Mapping**: Map arbitrary custom headers (e.g. `Item_Title`, `Total_Sales_Amt`, `Dept`) to canonical analytics fields (`productName`, `revenue`, `category`).
- **Data Validation & Cleaning**: Detects missing values, duplicates, and anomaly records. Generates an automated **Data Quality Score (%)**.
- **Dataset History & Switcher**: Toggle between multiple active datasets with persistent session state.

### 2. Comprehensive Analytics Dashboard
- **Executive Sales KPIs**: Real-time aggregation of Total Revenue, Total Units Sold, Gross Margin %, Active SKUs, Top Category, and Average Order Value (AOV).
- **Seasonal Demand Analytics**: In-depth decomposition across **Summer**, **Monsoon**, **Post-monsoon**, **Winter**, and **All Season** cycles with computed **Seasonal Indices** and Peak Festival correlations.
- **Product Demand & Inventory Matrix**: Real-time SKU ranking, stock-to-sales coverage ratios ($<1.0\times$ Low, $1.0-3.0\times$ Moderate, $>3.0\times$ Sufficient), and exact reorder recommendations.
- **Temporal Progression**: Month-over-Month (MoM) revenue & profit trends and Quarter-over-Quarter (Q1-Q4) comparisons.
- **Category & Region Intelligence**: Category market share (%) and geographic demand distribution.
- **Customer Segmentation**: Automatic classification into Budget (Low), Standard (Mid), and Premium (High) buyer value tiers.

### 3. AI/ML Forecasting Studio & Anomaly Engine
- **Holt-Winters Triple Exponential Smoothing**: Level, Trend, and Seasonal additive/multiplicative decomposition.
- **Moving Average Forecasting**: Simple (SMA) and Weighted (WMA) moving averages.
- **Seasonal Naive**: Seasonality-aligned persistence forecasting.
- **Confidence Intervals**: 80% and 95% forecast cones based on standard residual error.
- **Out-of-Sample Backtesting**: Automated 80/20 train-test evaluation yielding Mean Absolute Error (**MAE**), Root Mean Squared Error (**RMSE**), Mean Absolute Percentage Error (**MAPE**), and **Model Accuracy %**.
- **Statistical Anomaly Detection**: Outlier identification using Z-Scores ($|Z| \ge 2.0\sigma$) and Interquartile Range (IQR) fences.

### 4. Grounded AI Intelligence & Chat Assistant
- **Evidence-Based Insights Feed**: Automatic generation of Opportunity, Risk, Seasonality, and Efficiency cards with supporting metrics and strategic advice.
- **Interactive Conversational Assistant**: Strictly grounded natural language querying answering questions regarding stock adequacy, next-month forecasts, seasonal campaign timing, and customer demographics without hallucinations.

### 5. Multi-Format Report Generation
- **Executive PDF Briefs**: C-level executive summary, KPI tables, seasonal breakdowns, and AI recommendations streamed directly via PDFKit.
- **Multi-Tab Excel Workbooks**: Formatted multi-tab workbooks generated via ExcelJS (Executive Summary, Raw Records, Seasonal Breakdown, Category Shares).
- **Clean CSV Data**: Export normalized canonical records.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, JWT, BcryptJS, Multer, PDFKit, ExcelJS, XLSX |
| **ORM & Database** | Prisma ORM, PostgreSQL (Primary) / SQLite (Local Test Fallback) |
| **Forecasting & ML** | Holt-Winters Exponential Smoothing, SMA/WMA, Seasonal Naive, IQR / Z-Score Anomaly Engine |

---

## 🏗 System Architecture & Workflow

```mermaid
flowchart TD
    User["Admin / Business User"] -->|Browser| UI["React 18 + Vite Frontend"]
    
    subgraph Frontend ["Client Layer (Port 3000)"]
        UI --> Views["Dashboard, Seasonal, Products, Forecast, AI Chat, Upload, Reports"]
        Views --> Context["AuthContext & DatasetContext"]
        Context --> Axios["Axios API Client (JWT Interceptor)"]
    end

    Axios -->|REST API / JWT| API["Express.js Server (Port 5000)"]

    subgraph Backend ["Server Layer (Node.js)"]
        API --> AuthMw["Auth Middleware (JWT Verify)"]
        API --> Ingestion["Multer + Schema Detector + DataValidator"]
        API --> StatEngine["Statistical Analytics Engine"]
        API --> MLEngine["Forecasting & Backtesting Engine"]
        API --> AIEngine["AI Insights & Grounded Chat Engine"]
        API --> Exporter["PDFKit & ExcelJS Exporter"]
    end

    Ingestion -->|Prisma ORM| DB[(PostgreSQL / Prisma Database)]
    StatEngine --> DB
    MLEngine --> DB
```

---

## 📁 Complete Folder Structure

```
Agentic-AI-project-main/
├── package.json                 # Monorepo root script runner
├── .env.example                 # Environment template
├── .env                         # Server & DB environment variables (git-ignored)
├── .gitignore                   # Ignored directories and secret files
├── README.md                    # Primary technical documentation
│
├── server/                      # Node.js + Express Backend
│   ├── package.json             # Backend dependencies & scripts
│   ├── dev.db                   # Local SQLite database (portable test DB)
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL Prisma Schema (Production)
│   │   └── schema.sqlite.prisma # SQLite Prisma Schema (Local offline mode)
│   ├── src/
│   │   ├── index.js             # Express application entry point & static server
│   │   ├── db.js                # Singleton PrismaClient instance
│   │   ├── seed.js              # Database initialization & sample dataset seeder
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT authentication & role-based access middleware
│   │   ├── services/
│   │   │   ├── dataValidator.js # Ingestion, column mapping & validation engine
│   │   │   ├── forecastingEngine.js # Holt-Winters, Backtesting & Anomaly detector
│   │   │   ├── statisticalEngine.js # KPIs, Seasonal, Product, Category analytics
│   │   │   ├── aiInsightsEngine.js  # Evidence-based AI insights & Chat NLP
│   │   │   └── reportExporter.js    # PDFKit and ExcelJS generation suite
│   │   └── routes/
│   │       ├── authRoutes.js        # /api/auth (login, me, register)
│   │       ├── datasetRoutes.js     # /api/datasets (list, inspect, confirm, delete)
│   │       ├── analyticsRoutes.js   # /api/analytics (kpis, seasonal, trends, products)
│   │       ├── forecastingRoutes.js # /api/forecasting (predict, anomalies, runs)
│   │       ├── aiRoutes.js          # /api/ai (insights, chat)
│   │       └── reportRoutes.js      # /api/reports (pdf, excel, csv)
│   ├── test-integration.js      # Full automated integration test suite (33 tests)
│   └── test-upload.js           # Multi-format upload pipeline verification test
│
├── client/                      # React.js + Vite Frontend
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite dev server & proxy settings
│   ├── tailwind.config.js       # Glassmorphism design tokens & color palette
│   ├── index.html               # Web root with Outfit font
│   ├── src/
│   │   ├── main.jsx             # React DOM root entry
│   │   ├── App.jsx              # Main app shell & view router
│   │   ├── index.css            # Custom CSS & glassmorphic styling
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Authentication & JWT session provider
│   │   │   └── DatasetContext.jsx # Active dataset & global filter provider
│   │   ├── services/
│   │   │   └── api.js           # Axios client with automatic token attachment
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Top navigation, dataset selector, theme toggle
│   │   │   ├── Sidebar.jsx      # Responsive icon sidebar
│   │   │   ├── KpiCard.jsx      # Animated KPI card
│   │   │   └── GlobalFilters.jsx# Category, season, month filters
│   │   └── views/
│   │       ├── LoginView.jsx    # Admin login screen
│   │       ├── DashboardView.jsx# Executive dashboard with Recharts
│   │       ├── SeasonalView.jsx # Seasonal cycles & festival analytics
│   │       ├── ProductsView.jsx # Product demand & stockout risk matrix
│   │       ├── ForecastingView.jsx # Forecasting studio & confidence bands
│   │       ├── AiChatView.jsx   # AI insights & interactive dataset chat
│   │       ├── DatasetsView.jsx # Upload wizard, column mapper & history
│   │       └── ReportsView.jsx  # PDF, Excel, and CSV export hub
│
└── [Sample Datasets & Models]   # Reference datasets (electronics, cars, groceries, etc.)
```

---

## ⚙️ Prerequisites & Quickstart

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Local instance, Docker container, or Cloud (Neon, Supabase, AWS RDS)

### Quickstart Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd Agentic-AI-project-main
   ```

2. Install backend and frontend dependencies:
   ```bash
   npm --prefix server install
   npm --prefix client install
   ```

3. Initialize environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run database seed to initialize the admin user and pre-load benchmark datasets:
   ```bash
   node server/src/seed.js
   ```

5. Build client and launch production server:
   ```bash
   npm --prefix client run build
   node server/src/index.js
   ```
   Open **`http://localhost:5000`** in your browser.

---

## 🔐 Environment Variable Configuration

Create `.env` in the project root:

```env
# Server
PORT=5000
NODE_ENV=development

# Admin Initialization (Configured securely via seed script)
ADMIN_USERNAME=ajinkya
ADMIN_PASSWORD=12345678
ADMIN_EMAIL=admin@salesintelligence.local

# JWT Authentication
JWT_SECRET=super-secret-sales-intelligence-jwt-token-key-2026-change-in-production
JWT_EXPIRES_IN=7d

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sales_intelligence?schema=public"

# File Upload Limits
MAX_FILE_SIZE_MB=25
UPLOAD_DIR="./uploads"
```

---

## 👤 Admin Initialization & Authentication

1. Admin credentials are never hardcoded in the frontend or database scripts.
2. The seed script (`server/src/seed.js`) reads `ADMIN_USERNAME` and `ADMIN_PASSWORD` from the environment, generates a salt with **bcrypt** (cost factor 10), and securely stores the hashed password in the `users` table:
   ```bash
   node server/src/seed.js
   ```
3. Upon login (`POST /api/auth/login`), a signed **JSON Web Token (JWT)** is issued, valid for 7 days.
4. All subsequent API calls require:
   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```

---

## 🗄 PostgreSQL & Prisma Database Setup

### Prisma Schema (`server/prisma/schema.prisma`)
The platform uses Prisma ORM with 5 primary models:
- **`User`**: Admin and analyst credentials, role permissions.
- **`Dataset`**: Dataset metadata, row counts, detected column JSON, mapping JSON, and cached metrics.
- **`SaleRecord`**: Canonical sales records with SKU, product name, category, region, price, cost, stock, monthly sales, revenue, profit, margin %, customer segment, season, festival, month, quarter, and year.
- **`ForecastRun`**: History of predictive model runs with parameters, confidence intervals, and backtesting metrics.
- **`AiChatHistory`**: Audit trail of natural language questions, responses, and extracted telemetry.

### Running Migrations on PostgreSQL
When connecting to your live PostgreSQL database:
```bash
# Push schema directly to database
npm --prefix server exec prisma -- db push --schema=server/prisma/schema.prisma

# Generate Prisma Client
npm --prefix server exec prisma -- generate --schema=server/prisma/schema.prisma
```

---

## 🧠 AI/ML Forecasting Engine & Mathematical Formulations

### 1. Holt-Winters Triple Exponential Smoothing
Holt-Winters models Level ($L_t$), Trend ($T_t$), and Seasonality ($S_t$) with period $m$:

$$\begin{aligned}
\text{Level: } & L_t = \alpha (Y_t - S_{t-m}) + (1-\alpha)(L_{t-1} + T_{t-1}) \\
\text{Trend: } & T_t = \beta (L_t - L_{t-1}) + (1-\beta)T_{t-1} \\
\text{Seasonal: } & S_t = \gamma (Y_t - L_t) + (1-\gamma)S_{t-m} \\
\text{Forecast: } & \hat{Y}_{t+h} = L_t + h T_t + S_{t-m+(h \pmod m)}
\end{aligned}$$

Where:
- $\alpha \in (0,1)$ controls level responsiveness (default $0.3$).
- $\beta \in (0,1)$ controls trend slope smoothing (default $0.1$).
- $\gamma \in (0,1)$ controls seasonal cycle adaptation (default $0.3$).

### 2. Seasonality Index
$$\text{Seasonal Index} = \left(\frac{\text{Actual Seasonal Sales}}{\text{Average Season Sales}}\right) \times 100$$
- $\text{Index} > 100$: Above-average demand peak.
- $\text{Index} < 100$: Below-average low cycle.

### 3. Backtesting Accuracy Evaluation
Out-of-sample evaluation on an 80/20 train/test split:
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i|$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2}$$
- **Mean Absolute Percentage Error (MAPE)**:
  $$\text{MAPE} = \frac{100\%}{n} \sum_{i=1}^n \left|\frac{y_i - \hat{y}_i}{y_i}\right|$$
- **Overall Model Accuracy %**:
  $$\text{Accuracy} = \max(0, 100\% - \text{MAPE})$$

### 4. Confidence Interval Cones (80% & 95%)
$$\hat{Y}_{t+h} \pm Z \times \text{RMSE} \times \sqrt{h}$$
- $Z = 1.28$ for $80\%$ confidence.
- $Z = 1.96$ for $95\%$ confidence.

---

## 📡 REST API Documentation & Contracts

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Authenticate with username & password | No |
| `GET` | `/api/auth/me` | Fetch active session profile | Yes |
| `POST` | `/api/auth/register` | Register additional analyst accounts | Yes (Admin) |

### Datasets (`/api/datasets`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/datasets` | List all available datasets | Yes |
| `POST` | `/api/datasets/inspect` | Upload file (multipart), infer columns & mapping | Yes |
| `POST` | `/api/datasets/confirm` | Confirm column mapping & commit to database | Yes |
| `GET` | `/api/datasets/:id` | Fetch dataset details & sample records | Yes |
| `DELETE` | `/api/datasets/:id` | Delete dataset and cascaded records | Yes |

### Analytics (`/api/analytics/:datasetId`)
| Method | Endpoint | Description | Query Filters |
| :--- | :--- | :--- | :--- |
| `GET` | `.../kpis` | Overall executive financial KPIs | `category`, `season`, `month` |
| `GET` | `.../seasonal` | Seasonal demand cycles & peak festivals | `category`, `region`, `month` |
| `GET` | `.../trends` | Monthly MoM & Quarterly comparisons | `category`, `season` |
| `GET` | `.../products` | SKU demand ranking & stockout risks | `category`, `season` |
| `GET` | `.../categories`| Category revenue share & margins | `season`, `month` |
| `GET` | `.../regions` | Regional geographic demand distribution | `category`, `season` |
| `GET` | `.../segments` | Budget, Standard, Premium buyer tiers | `category`, `season` |

### Forecasting & AI (`/api/forecasting`, `/api/ai`)
| Method | Endpoint | Description | Body / Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/forecasting/:id/predict` | Run forecast with backtesting | `{ algorithm, targetType, horizon, parameters }` |
| `GET` | `/api/forecasting/:id/anomalies` | Statistical outliers ($Z \ge 2\sigma$, IQR) | `field=revenue` |
| `GET` | `/api/ai/:id/insights` | Evidence-based executive business insights | — |
| `POST` | `/api/ai/:id/chat` | Natural language query with telemetry | `{ message, selectedProduct }` |

### Reports (`/api/reports/:datasetId`)
| Method | Endpoint | Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `.../pdf` | Application/pdf | Formatted C-Level Executive PDF Brief |
| `GET` | `.../excel` | .xlsx (Workbook) | Multi-tab Excel report |
| `GET` | `.../csv` | Text/csv | Normalized canonical sales records |

---

## 📥 Dataset Ingestion & Dynamic Mapping Guide

1. Open the **Datasets & Ingestion** page in the application.
2. Click **Upload New Dataset**.
3. Select any `.csv`, `.xls`, or `.xlsx` file.
4. The system automatically inspects all column headers and detects data types.
5. In Step 2, review the **Dynamic Column Mapping**:
   - Align your custom column names to canonical fields (`Product Name`, `Category`, `Revenue`, `Monthly Sales`, `Stock`, etc.).
6. In Step 3, view the **Validation Report** (Total rows, Data Quality Score, missing value counts).
7. Click **Confirm & Save Dataset** to write clean records to the database.

---

## 🧪 Testing & Verification Guide

Run the comprehensive integration test suite to verify all 33 test cases:
```bash
node server/test-integration.js
```

Verify multi-format upload and dynamic column mapping pipeline:
```bash
node server/test-upload.js
```

Verify React frontend build:
```bash
npm --prefix client run build
```

---

## 🚢 Deployment & Troubleshooting

### Running in Production
```bash
# 1. Build React frontend
npm --prefix client run build

# 2. Start Express server (serves both API & Frontend on port 5000)
npm --prefix server start
```

### Common Issues & Solutions
- **Port 5000 in use**: Set `PORT=5001` in `.env` and restart.
- **Database Connection Refused**: Verify PostgreSQL is running on the connection string in `DATABASE_URL`. For local offline testing, SQLite (`dev.db`) is automatically available.
- **File Upload Exceeds Limit**: Adjust `MAX_FILE_SIZE_MB=50` in `.env`.

