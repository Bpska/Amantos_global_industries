# Retailer Onboarding & Sales Tracking System - Backend API

A production-grade, secure, and robust Backend API built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

---

## 🌟 Tech Stack & Features

- **Core Runtime**: Node.js + TypeScript + Express.js
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access Token, 7-day expiration), bcrypt password hashing
- **Validation**: Strict schema validation with Zod on request body, query, and params
- **Security & Reliability**:
  - `helmet` security headers
  - `cors` cross-origin resource sharing
  - `express-rate-limit` (100 requests per minute per IP)
  - `morgan` HTTP request logging
  - Centralized Error Handling with standard `{ success, message, data, error }` responses
- **Timezone Management**: Accurate IST (`Asia/Kolkata`) date, day name, and midnight range derivations
- **Containerization**: `Dockerfile` + `docker-compose.yml` (API + PostgreSQL service)
- **Interactive Documentation**: Swagger / OpenAPI 3.0 at `/api/docs`

---

## 🛡️ Roles & Business Rules

### 1. ADMIN
- **Seeded exclusively**: Created solely through `npm run seed`. No public registration endpoint exists.
- **Privileges**: Can view all shops, all orders, sales performance metrics, manage salespersons, reset passwords, and export data.

### 2. SALESPERSON
- **Created exclusively by Admin**: Admin defines the username and initial password.
- **Isolated Data Access**: Salespersons can view and manage **ONLY** their own shops, orders, and payment collections.
- **Deactivation Control**: Deactivated salespersons cannot log in, and any existing active JWT tokens are rejected on every request (`isActive` check on every request).

### 3. Core Business Rules
- **Server-Side Computations**: `totalAmount`, `balanceDue`, and `visitDay` are computed strictly on the server and are never trusted from client input.
- **Baki Calculation Formula**:
  - `totalAmount = quantity * unitPrice`
  - `balanceDue = totalAmount - amountPaid`
  - Validation: `quantity > 0` (integer), `unitPrice > 0`, `0 <= amountPaid <= totalAmount`.
  - **Example**: `quantity = 100`, `unitPrice = 5` -> `totalAmount = 500`, `amountPaid = 200` -> `balanceDue = 300`.
- **Payment Collection**:
  - At order creation, if `amountPaid > 0`, the first `Payment` row is created automatically within an atomic database transaction.
  - Subsequent payments reduce `balanceDue` and increase `amountPaid`. `paymentAmount` cannot exceed current `balanceDue`.
- **Timezone**: Day of week (e.g., "Thursday") and today's metrics are computed in **IST (`Asia/Kolkata`)**.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory (or use `.env.example`):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/retailer_db?schema=public` |
| `JWT_SECRET` | Secret key for signing 7-day JWT tokens | `super-secret-jwt-key-retailer-onboarding-2026` |
| `ADMIN_SEED_USERNAME` | Username for the seeded Admin | `admin` |
| `ADMIN_SEED_PASSWORD` | Password for the seeded Admin | `AdminPassword@123` |

---

## 🚀 Getting Started

### Option 1: Run with Docker Compose (Recommended)

From the project root:
```bash
docker-compose up --build
```
This automatically boots:
1. PostgreSQL container on port `5432` with healthcheck.
2. API container on port `5000`, runs `prisma db push`, executes `seed`, and starts the server.

Access:
- **API Base URL**: `http://localhost:5000/api/v1`
- **Swagger Documentation**: `http://localhost:5000/api/docs`

---

### Option 2: Local Development

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **Push Database Schema**:
   ```bash
   npm run prisma:push
   ```

4. **Seed Database** (creates Admin, 2 Salespersons, 5 Shops with Orders & Payments):
   ```bash
   npm run seed
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

6. **Run Unit & Integration Tests**:
   ```bash
   npm test
   ```

---

## 📚 API Endpoints Overview

All routes are prefixed with `/api/v1`.

### 1. Authentication
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Login with username & password | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Authenticated |
| `POST` | `/api/v1/auth/change-password` | Change own administrator password | Admin |
| `PATCH` | `/api/v1/auth/password` | Alias for changing own administrator password | Admin |

### 2. Admin Only (Requires Role: `ADMIN`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/admin/salespersons` | Create a new salesperson account |
| `GET` | `/api/v1/admin/salespersons` | List salespersons with aggregated totals (shops, sales, collected, baki) |
| `PATCH` | `/api/v1/admin/salespersons/:id` | Update salesperson details or activate/deactivate |
| `POST` | `/api/v1/admin/salespersons/:id/reset-password` | Reset salesperson password |
| `GET` | `/api/v1/admin/shops` | List all shops (search, filter by salesperson/date, paginated) |
| `GET` | `/api/v1/admin/shops/:id` | Shop details with all orders and payments |
| `GET` | `/api/v1/admin/orders` | Orders list (filter by salesperson, date range, status = PAID/PARTIAL/UNPAID) |
| `GET` | `/api/v1/admin/dashboard` | Dashboard metrics (totals, today IST numbers, 7-day chart, top 5 SP, top 5 baki) |
| `GET` | `/api/v1/admin/export/orders.csv` | Export filtered orders as downloadable CSV |

### 3. Salesperson (Requires Role: `SALESPERSON` or `ADMIN`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/shops` | Onboard new shop AND record first order in one atomic transaction |
| `GET` | `/api/v1/shops/mine` | List shops onboarded by current salesperson (search + paginated) |
| `GET` | `/api/v1/shops/:id` | View shop details (salesperson sees only their own) |
| `POST` | `/api/v1/shops/:id/orders` | Place repeat order for an existing shop |
| `POST` | `/api/v1/orders/:id/payments` | Record payment against order (collect baki) |
| `GET` | `/api/v1/me/summary` | Performance summary (my shops, total sales, collected, baki, today numbers) |

---

## 🧪 Sample cURL Requests

### 1. Admin Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "AdminPassword@123"
  }'
```

### 2. Create Salesperson (Admin Only)
```bash
curl -X POST http://localhost:5000/api/v1/admin/salespersons \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sp_suresh",
    "password": "Sales@123Suresh",
    "fullName": "Suresh Raina",
    "phone": "+919876500000"
  }'
```

### 3. Salesperson Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sp_rajesh",
    "password": "Sales@123Rajesh"
  }'
```

### 4. Onboard Shop & First Order (Salesperson)
```bash
curl -X POST http://localhost:5000/api/v1/shops \
  -H "Authorization: Bearer <SALESPERSON_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "shopName": "Sri Balaji Stores",
    "location": "MG Road, Indiranagar, Bengaluru",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "ownerName": "Balaji Rao",
    "contactNumber": "9845019999",
    "productName": "Mixture Pack",
    "quantity": 100,
    "unitPrice": 5,
    "amountPaid": 200,
    "visitDate": "2026-10-22",
    "notes": "Delivered first batch. 300 balance due."
  }'
```

### 5. Collect Baki Payment
```bash
curl -X POST http://localhost:5000/api/v1/orders/<ORDER_ID>/payments \
  -H "Authorization: Bearer <SALESPERSON_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "paidOn": "2026-10-22",
    "note": "Collected partial baki in cash"
  }'
```

### 6. Get Admin Dashboard
```bash
curl -X GET http://localhost:5000/api/v1/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 7. Export Orders as CSV
```bash
curl -X GET "http://localhost:5000/api/v1/admin/export/orders.csv?status=PARTIAL" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -o orders_export.csv
```
