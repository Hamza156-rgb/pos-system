# POS & Inventory Management System

A full-stack Point of Sale and Inventory Management system for a stationery / general retail store, built with **React (Vite) + Material UI** on the frontend and **Node.js / Express + Sequelize + MySQL** on the backend. Fully containerized with Docker.

## Tech Stack

- **Frontend:** React 18, Vite, React Router, React Query (TanStack), Material UI, Axios, Recharts
- **Backend:** Node.js, Express, Sequelize ORM, JWT auth (access + refresh), bcrypt
- **Database:** MySQL 8
- **Infra:** Docker + docker-compose, Nginx (serves the built SPA and proxies `/api`)

## Quick Start (Docker)

From the project root:

```bash
docker-compose up --build
```

This starts three containers: MySQL, the Express API, and the Nginx-served React app. On first boot the backend waits for the database, syncs the schema, and seeds demo data automatically (`AUTO_SEED=true`).

Once running:

- **App:** http://localhost:5173
- **API:** http://localhost:5000/api
- **Health check:** http://localhost:5000/api/health

### Demo Login Credentials

| Role    | Email            | Password   |
|---------|------------------|------------|
| Admin   | admin@pos.com    | admin123   |
| Cashier | cashier@pos.com  | cashier123 |

## Local Development (without Docker)

You need Node.js 20+ and a running MySQL instance.

**Backend**

```bash
cd backend
cp .env.example .env        # adjust DB credentials / set DB_HOST=127.0.0.1
npm install
npm run dev                 # starts on http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173, proxies /api -> :5000
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so no extra config is needed.

## Project Structure

```
pos-system/
├── backend/
│   └── src/
│       ├── config/         # Sequelize connection
│       ├── controllers/    # Route handlers
│       ├── middlewares/    # auth, rbac, validation, error handler, audit
│       ├── models/         # Sequelize models + associations
│       ├── routes/         # Express routers
│       ├── services/       # Business logic (sales, inventory)
│       ├── utils/          # logger, JWT, ApiError, response helpers
│       ├── app.js          # Express app (helmet, cors, rate-limit)
│       ├── server.js       # DB connect + sync + seed + listen
│       └── seed.js         # Demo data
├── frontend/
│   └── src/
│       ├── components/     # Layout, ProtectedRoute, Receipt
│       ├── context/        # Auth + i18n providers
│       ├── hooks/          # React Query wrappers
│       ├── pages/          # Dashboard, POS, Products, Inventory, etc.
│       ├── services/       # Axios instance with token refresh
│       ├── locales/        # English + Urdu translations
│       └── utils/          # Offline sales queue
├── docker-compose.yml
├── sample-products.csv     # Demo CSV for bulk import
└── API.md                  # API reference
```

## Features

- **Authentication & RBAC** — JWT with refresh tokens, bcrypt hashing, Admin and Cashier roles.
- **Dashboard** — today/week/month sales, low-stock count, top sellers, 7-day chart, recent transactions.
- **Products** — full CRUD, search, pagination, auto SKU/barcode generation, CSV import/export.
- **Inventory** — stock in/out/adjustment, movement history with running balance, low-stock view.
- **Suppliers** — CRUD plus per-supplier purchase history.
- **Purchases** — multi-item purchase orders; receiving a PO automatically stocks in.
- **Customers** — CRUD, purchase history, outstanding balance, and **Udhaar (credit)** repayment.
- **POS** — fast cart UI, barcode lookup, discounts, tax, cash/card/mixed/credit payments, change calculation, customer selection.
- **Receipts** — 58mm / 80mm thermal templates with direct browser printing.
- **Reports** — sales (daily/weekly/monthly/yearly/custom), inventory valuation, financial (revenue/COGS/profit/margin), daily cash closing; CSV export.
- **Settings** — shop info, tax %, currency, receipt template/footer.
- **Audit Logs** — login, product, sale, and stock-adjustment activity.
- **Offline sales** — sales are queued in the browser when offline and synced when back online.
- **i18n** — English and Urdu (with RTL layout).
- **WhatsApp invoice sharing** from the POS screen.
- **Security** — helmet, CORS, rate limiting, request validation, parameterized queries via Sequelize.

## Importing the Sample CSV

Log in as admin, go to **Products → Import**, and upload `sample-products.csv` from the project root.

## Notes

The schema is created via `sequelize.sync({ alter: true })` for convenience. For a production deployment you would switch to versioned migrations, replace the demo JWT secrets, set `AUTO_SEED=false` after the first run, and place the API behind HTTPS.
