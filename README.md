# Automated Inventory Alert System

A web application that helps businesses **track product stock levels** and **get alerted** when items are running low or out of stock. Think of it as a simplified warehouse management tool with a clean dashboard, real-time notifications, and downloadable reports.

---

## What Does This Project Do?

Imagine you run a warehouse with hundreds of products. You need to know:
- Which items are running low?
- Which items are completely out of stock?
- What is the total value of your inventory?

This system answers all of that through:

1. **A Dashboard** — Shows 4 summary cards (total products, low stock count, out of stock count, total inventory value in ₹) and a table listing every product with colour-coded status badges (green = in stock, yellow = low, red = out of stock).

2. **Inventory Management Page** — Add new products, edit quantities, delete items, and search/filter the full product list.

3. **Reports Page** — Generate a CSV or JSON snapshot of your inventory. The file downloads automatically and a history of past reports is saved in the browser.

4. **Alerts** — Two alert systems work together:
   - A **bell icon** in the top bar shows a count badge and opens a slide-out panel listing every low/out-of-stock product (auto-refreshes every 30 seconds).
   - **Toast notifications** pop up in the bottom-right corner whenever a product falls below its threshold — red for out of stock, yellow for low stock.

5. **Background Scheduler** — A separate Python script runs on a timer (default: every 30 minutes), checks stock levels, prints alerts to the terminal, and auto-generates a CSV report if anything is low.

---

## How It Works (Architecture)

```
┌────────────────┐         HTTP (REST API)         ┌────────────────────┐
│                │  ◄──────────────────────────────►│                    │
│  React Frontend│       http://localhost:3000      │  FastAPI Backend   │
│  (Browser UI)  │                                  │  http://localhost:8000
│                │         Axios requests           │                    │
└────────────────┘         (JSON data)              └────────┬───────────┘
                                                             │
                                                    SQLAlchemy ORM
                                                             │
                                                    ┌────────▼───────────┐
                                                    │     MySQL 8        │
                                                    │  (products table)  │
                                                    └────────────────────┘

┌────────────────┐
│   Scheduler    │  Runs independently in a terminal.
│  (scheduler.py)│  Queries DB every 30 min, prints alerts,
│                │  auto-generates CSV reports.
└────────────────┘
```

**In simple terms:**
- The **frontend** (React) is what you see in the browser — the dashboard, forms, tables.
- The **backend** (FastAPI) is the server that stores and retrieves data. The frontend talks to it via API calls.
- The **database** (MySQL) stores all product data permanently.
- The **scheduler** is a standalone script that watches inventory in the background.

---

## Tech Stack

| Layer      | Technology                            | Why?                                                |
|------------|---------------------------------------|-----------------------------------------------------|
| Backend    | Python 3.13 · FastAPI · Pydantic v2   | Fast, modern Python web framework with auto-validation |
| Frontend   | React 18 · React Router v6 · Axios    | Component-based UI with client-side routing          |
| Database   | MySQL 8 via SQLAlchemy + PyMySQL      | Industry-standard relational DB with Python ORM      |
| Scheduler  | Python `schedule` library             | Lightweight cron-like task runner                     |

---

## Project Structure

```
inventory_alert/
│
├── backend/                        ← Python API server
│   ├── app/
│   │   ├── config.py               ← Reads .env file, sets DB URL & thresholds
│   │   ├── database.py             ← Connects to MySQL, provides DB sessions
│   │   ├── main.py                 ← Creates the FastAPI app, enables CORS
│   │   ├── models.py               ← Defines the "products" table structure
│   │   ├── routes.py               ← All API endpoints (CRUD, alerts, reports)
│   │   ├── schemas.py              ← Validates incoming/outgoing JSON data
│   │   └── report_utils.py         ← Writes CSV and JSON report files
│   ├── scheduler.py                ← Background stock-level checker
│   ├── .env                        ← Your DB credentials (not pushed to Git)
│   └── requirements.txt            ← Python dependencies
│
├── frontend/                       ← React browser app
│   ├── public/index.html
│   └── src/
│       ├── api.js                  ← All API calls in one place (Axios)
│       ├── App.js                  ← Main layout: sidebar + topbar + pages
│       ├── App.css                 ← All styles
│       ├── index.js                ← React entry point
│       ├── components/
│       │   ├── Sidebar.js          ← Left navigation menu
│       │   ├── AlertsPanel.js      ← Bell icon + slide-out alerts list
│       │   ├── StatusBadge.js      ← Green / yellow / red status pill
│       │   └── ToastContainer.js   ← Pop-up notifications for low stock
│       └── pages/
│           ├── Dashboard.js        ← Summary cards + stock table
│           ├── Inventory.js        ← Add / edit / delete products
│           └── Reports.js          ← Generate & download CSV/JSON reports
│
├── .gitignore
└── README.md
```

---

## Getting Started

### What You Need Installed

| Tool       | Version | Download                        |
|------------|---------|---------------------------------|
| Python     | 3.10+   | https://python.org              |
| Node.js    | 18+     | https://nodejs.org              |
| MySQL      | 8+      | https://dev.mysql.com/downloads |

> MySQL is optional to start — the app boots fine without it and shows a warning. You can connect it later.

### Step 1 — Set Up the Backend

```bash
cd backend

# Create a virtual environment (keeps dependencies isolated)
python3 -m venv venv

# Activate it
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows

# Install all Python packages
pip install -r requirements.txt
```

### Step 2 — Configure the `.env` File

Edit `backend/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=inventory_db

LOW_STOCK_THRESHOLD=10            # products with ≤ this quantity trigger alerts
CHECK_INTERVAL_MINUTES=30         # how often the scheduler checks stock
```

### Step 3 — Start the Backend Server

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
✅ Database tables created / verified.
```

> If MySQL isn't running, you'll see a warning instead — that's OK, the server still starts.

### Step 4 — Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install                       # first time only
npm start                         # opens http://localhost:3000
```

### Step 5 — Set Up MySQL (when ready)

Just create the database — SQLAlchemy auto-creates the table on the next server restart:

```sql
CREATE DATABASE IF NOT EXISTS inventory_db;
```

Then restart the backend and everything connects automatically.

### Step 6 — Start the Scheduler (optional)

Open another **new terminal**:

```bash
cd backend
source venv/bin/activate
python scheduler.py
```

This runs in the background, checks stock every 30 minutes, and prints alerts + generates CSV reports automatically.

---

## API Endpoints

All endpoints are under the `/api` prefix. You can explore them interactively at **http://localhost:8000/docs** (Swagger UI).

### Products (CRUD)

| Method   | URL                         | What It Does                           | Example Body                                                                 |
|----------|-----------------------------|----------------------------------------|------------------------------------------------------------------------------|
| `GET`    | `/api/products`             | Get all products (sorted by name)      | —                                                                            |
| `GET`    | `/api/products/3`           | Get product with ID 3                  | —                                                                            |
| `POST`   | `/api/products`             | Add a new product                      | `{"name":"Widget A","sku":"WDG-001","quantity":50,"price":299.99}`           |
| `PUT`    | `/api/products/3`           | Update a product's details             | `{"name":"Widget A v2","price":349.99}`                                      |
| `PATCH`  | `/api/products/3/stock`     | Quick-update stock quantity only       | `{"quantity":25}`                                                            |
| `DELETE` | `/api/products/3`           | Delete a product                       | —                                                                            |

### Alerts

| Method | URL             | What It Does                                                  |
|--------|-----------------|---------------------------------------------------------------|
| `GET`  | `/api/alerts`   | Returns products where `quantity ≤ low_stock_threshold`       |

### Reports

| Method | URL                                    | What It Does                              |
|--------|----------------------------------------|-------------------------------------------|
| `POST` | `/api/reports?fmt=csv`                 | Generate a CSV report file                |
| `POST` | `/api/reports?fmt=json`                | Generate a JSON report file               |
| `GET`  | `/api/reports/download/{filename}`     | Download a previously generated report    |

---

## Database Schema

Only one table — `products`:

| Column               | Type         | Description                                          |
|----------------------|--------------|------------------------------------------------------|
| `id`                 | INT          | Auto-incrementing primary key                        |
| `name`               | VARCHAR(255) | Product name (must be unique)                        |
| `sku`                | VARCHAR(100) | Stock Keeping Unit code (must be unique)             |
| `quantity`           | INT          | Current stock count (0 = out of stock)               |
| `price`              | FLOAT        | Unit price in ₹                                      |
| `low_stock_threshold`| INT          | Alert triggers when quantity drops to this or below  |
| `created_at`         | DATETIME     | When the product was first added                     |
| `updated_at`         | DATETIME     | Last time any field was modified                     |

---

## How Key Features Work

### Alert System
- Every product has its own `low_stock_threshold` (default 10).
- If `quantity ≤ threshold` → the product shows up in alerts.
- If `quantity = 0` → it's flagged as "Out of Stock" (red).
- The bell icon in the UI polls the `/api/alerts` endpoint every 30 seconds.
- Toast pop-ups appear once per product per browser session (tracked via `sessionStorage`).

### Report Downloads
- When you click "Generate Report", the backend writes a timestamped file (e.g., `stock_report_20260310_143022.csv`) into the `backend/reports/` folder.
- The browser immediately downloads it.
- The Reports page keeps a history in `localStorage` so you can re-download older reports.

### Background Scheduler
- `scheduler.py` is a standalone script — it does NOT run inside the web server.
- It opens its own database connection, queries for low-stock items, prints them to the terminal, and auto-generates a CSV report.
- Runs in an infinite loop, checking every `CHECK_INTERVAL_MINUTES` (default: 30).

---

## Environment Variables Reference

Set these in `backend/.env`:

| Variable                  | Default        | What It Controls                                 |
|---------------------------|----------------|--------------------------------------------------|
| `DB_HOST`                 | `localhost`    | MySQL server address                             |
| `DB_PORT`                 | `3306`         | MySQL port                                       |
| `DB_USER`                 | `root`         | MySQL username                                   |
| `DB_PASSWORD`             | `password`     | MySQL password                                   |
| `DB_NAME`                 | `inventory_db` | Name of the MySQL database                       |
| `LOW_STOCK_THRESHOLD`     | `10`           | Default alert threshold for new products         |
| `CHECK_INTERVAL_MINUTES`  | `30`           | How often the scheduler checks (in minutes)      |
| `REPORTS_DIR`             | `reports`      | Folder where report files are saved              |

---

## License

MIT
