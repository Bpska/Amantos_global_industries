# RetailFlow — Retailer Onboarding & Sales Tracking System

RetailFlow is a full-stack, enterprise-grade system designed for FMCG, distribution, and retail sales teams to onboard retailers, record visit orders, track BAKI (credit / balance due), and generate real-time collections reports.

---

## 🌟 Key Features

### For Field Sales Representatives
* **1-Tap Retailer Onboarding**: Capture shop name, owner details, contact info, GPS location with reverse geocoding, and the initial stock order.
* **Smart BAKI Tracking**: Automatic calculation of Total Amount, Amount Paid, and Balance Due.
* **Instant Communications**: 1-tap Phone dialer (`tel:`) and direct WhatsApp reminder messaging (`wa.me`) for outstanding collections.
* **Repeat Orders & Payment Receipts**: Record repeat orders and log incremental payments with full transaction logs.
* **1-Click Client Demo Mode**: Instant demonstration of app flows without manual typing or network setup.

### For Business Administrators
* **Executive Dashboard**: Real-time KPI summaries, Total BAKI banner, today's visit/order breakdown, and 7-day sales graph.
* **Team Performance Rankings**: Leaderboard ranking top sales representatives by total sales, shops onboarded, and collection rates.
* **Retailer Credit Risk Analysis**: Identify highest BAKI retailers for prioritized credit recovery.
* **Advanced Filter & Search**: Filter shops and orders by date range, salesperson, payment status (`PAID`, `PARTIAL`, `UNPAID`), and full-text search.
* **Data Export**: Export orders and collections to CSV for audit and accounting systems.
* **Team Management**: Create and edit sales team members, toggle active/inactive status, and securely generate/reset passwords.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile & Web Frontend** | Expo SDK 58, React Native, React 19, Expo Router (file-based navigation), React Query (TanStack Query), Zustand (state management), Expo SecureStore |
| **Backend API** | Node.js 20, Express, TypeScript, Prisma ORM, JSON Web Tokens (JWT), Bcrypt, Zod validation, Swagger / OpenAPI documentation |
| **Database** | PostgreSQL 16 with indexed queries and atomic transaction rollbacks |
| **Deployment & DevOps** | Docker, Docker Compose, Multi-stage alpine builds, EAS CLI, GitHub Actions CI/CD |

---

## ⚡ Quick Start (Local Development)

### 1. Start the Backend API & Database
```bash
# Clone the repository
git clone https://github.com/your-org/retailer-onboarding.git
cd retailer-onboarding

# Option A: Start with Docker Compose
docker compose up -d

# Option B: Run locally
cd backend
npm install
npm run prisma:push
npm run seed
npm run dev
```
The API will be live at `http://localhost:5000` with Swagger docs at `http://localhost:5000/api/docs`.

### 2. Start the Admin Web Console

Keep the backend running, then open another terminal in the project root:

```bash
npm run admin:dev
```

Open `http://localhost:5173`. The admin console forwards API requests to
`http://localhost:5000`; both servers must be running to create field sales
representatives. To restart the API from the project root, run
`npm run backend:dev`. Check `http://localhost:5000/health` if saving fails.

### 3. Start the Mobile / Web App
In the project root:
```bash
npm install
npx expo start
```
* Press **`w`** to open in Web browser.
* Press **`a`** to launch in Android Emulator.
* Scan the QR code with **Expo Go** on your physical phone (ensure `.env` has your PC's Wi-Fi IP address).

---

## 🔑 Default Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `AdminPassword@123` |
| **Salesperson 1** | `sp_rajesh` | `Sales@123Rajesh` |
| **Salesperson 2** | `sp_amit` | `Sales@123Amit` |

---

## 🚢 Production Deployment

For detailed production deployment instructions, please see [**`DEPLOYMENT.md`**](./DEPLOYMENT.md):
* **Docker Compose** on any VPS (DigitalOcean, AWS EC2, Linode, Ubuntu server)
* **Cloud Platforms** (Railway, Render, Fly.io, Supabase)
* **Mobile APK & AAB Builds** via Expo EAS CLI
* **Web Static Hosting** (Vercel, Netlify, Nginx)

---

## 🧪 Quality & Tests

```bash
# Run backend test suite (20 automated unit & integration tests)
npm --prefix backend test

# Run backend TypeScript build
npm --prefix backend run build

# Run mobile frontend TypeScript validation
npm run typecheck

# Build web export bundle
npm run build:web
```
