# Inventory Alert System

> Monitor stock levels, get low-stock alerts, and generate CSV/JSON reports.

## Tech Stack
| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | Python 3 · FastAPI      |
| Frontend  | React 18                |
| Database  | MySQL (via SQLAlchemy)  |
| Scheduler | `schedule` library      |

---

## Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
pip install -r requirements.txt
```

Edit `.env` with your MySQL credentials (another team member will configure the DB).

**Run the API server:**
```bash
uvicorn app.main:app --reload --port 8000
```

**Run the background scheduler (separate terminal):**
```bash
source venv/bin/activate
python scheduler.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm start            # opens http://localhost:3000
```

---

## API Endpoints (prefix: `/api`)

| Method  | Path                        | Description                  |
|---------|-----------------------------|------------------------------|
| GET     | `/products`                 | List all products            |
| GET     | `/products/{id}`            | Get single product           |
| POST    | `/products`                 | Create product               |
| PUT     | `/products/{id}`            | Update product fields        |
| PATCH   | `/products/{id}/stock`      | Update stock quantity only   |
| DELETE  | `/products/{id}`            | Delete product               |
| GET     | `/alerts`                   | Low-stock alerts             |
| POST    | `/reports?fmt=csv\|json`    | Generate stock report file   |

Interactive docs at **http://localhost:8000/docs** (Swagger UI).
