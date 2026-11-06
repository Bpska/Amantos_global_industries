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

🚀 How to Deploy on Your Server / VPS (3 Steps)
Step 1: Point your Domain in DNS

In your domain registrar / DNS manager (Cloudflare, GoDaddy, Hostinger, AWS, etc.):

Add an A Record:
Host / Name: industri (or @ if using root)
Value / IPv4: <Your_Server_Public_IP>
Step 2: Start the Containers

Upload or clone your project onto your server and run:

bash
docker compose --env-file .env.production up -d --build
Step 3: Activate Free SSL Certificate

Once your DNS points to your server, run:

bash
chmod +x docker/init-ssl.sh
./docker/init-ssl.sh industri.heylane.in admin@heylane.in

(On Windows PowerShell: .\docker\init-ssl.ps1 -Domain industri.heylane.in -Email admin@heylane.in)

Your website is now live with green padlock SSL at:

Staff Panel: https://industri.heylane.in
Admin Panel: https://industri.heylane.in/admin
tell me the cmd run the projecct

Here are the exact commands to run the project:

Option 1: Run with Docker (Production / Deployment)

To run all services (PostgreSQL, Backend API, Admin Panel, Staff Panel, and Nginx Gateway) in Docker containers:

bash
docker compose --env-file .env.production up -d --build
To check container status:
bash
docker compose ps
To view live logs:
bash
docker compose logs -f
To stop the project:
bash
docker compose down
Option 2: Run Locally (Development)

Open 3 separate terminal tabs in d:\New_Logisaar\Onbord_App:

Terminal 1: Start Backend API
bash
npm --prefix backend start

Runs at: http://localhost:5000
 (Health Check: http://localhost:5000/health
)

Terminal 2: Start Admin Web Portal
bash
npm --prefix admin-web run dev -- --host

Runs at: http://localhost:5173

Terminal 3: Start Staff / Seller Web Panel
bash
npx expo start --web

Runs at: http://localhost:8081

Default Login Credentials:
Admin Portal:
Username: admin
Password: AdminPassword@123
Staff / Seller Panel:
Username: Any sales representative created in the Admin Panel (e.g. bps kar)
propoly do one this the Login page propol redesign Heylane type of design propoly design it propoly do this . redesign the landing page propoly 
✨ Heylane Redesign Complete: Luxury Executive Login & Landing Page

The Login and Landing pages have been redesigned to match the Heylane / AGI luxury executive brand aesthetic (industri.heylane.in), featuring the dark carbon texture, gold emblem medallion, glowing accents, and enterprise typography.

🏛️ Summary of What Was Redesigned
1. Heylane Enterprise Landing Page (app/index.tsx)
Live Route: http://localhost:8081/ (or https://industri.heylane.in/)
Executive Hero & Medallion:
Features the official Gold AGI Emblem with a radiant ambient backlight and polished gold border ring.
Gold verified pill: INDUSTRI.HEYLANE.IN · ENTERPRISE SYSTEM.
Brand typography: HEYLANE — Industrial & Commercial Distribution.
Dual Action CTAs:
"Launch Field Staff Portal" → Direct access to Field Representative Sign-In.
"Executive Web Management" → Seamless transition to the Web Admin Console (/admin).
Live System Telemetry:
Displays real-time status badges: Database: Online (PostgreSQL 16), Security: TLS 1.3 Active, Latency: < 20ms.
Platform Capability Showcase:
🏪 Rapid Store Onboarding: Sub-60s retailer registration with GPS, KYC, and product allocation.
🔁 30-Day Recurring Replenishment: Monthly repeat order engine with custom decimal pricing.
🧾 Physical & Digital Billing: Hardcopy paper routing + 1-click Admin WhatsApp dispatch.
📊 Real-Time Staff Telemetry: Store visit volume, route efficiency, and financial audit logs.
2. Admin Executive Login Page (admin-web/src/pages/LoginPage.tsx & index.css)
Live Route: http://localhost:5173/login (or https://industri.heylane.in/admin/login)
Design & Styling:
Deep obsidian/carbon textured background with subtle gold radial illumination.
Frosted glassmorphism card with precision gold border (rgba(212, 175, 55, 0.3)) and gold metallic drop shadows.
Prominent AGI Gold Emblem (/assets/agi-logo.jpg).
Domain badge: Authoritative Node: industri.heylane.in.
Features & Shortcuts:
"Use Demo Credentials" button: 1-click instant fill for testing (admin / admin123).
Luxury gold metallic button: "Sign In to Executive Console".
Quick link to switch directly to the Field Representative Mobile App.
Security footer: TLS 1.3 Active · PostgreSQL Dedicated · industri.heylane.in.
3. Field Workforce Login Page (app/login.tsx)
Live Route: http://localhost:8081/login
Features & Styling:
Executive dark & gold aesthetic with the Gold AGI Emblem badge.
Quick 1-tap demo credentials pills for Admin (admin) and Field Sales Rep (sp_rajesh).
Sleek inputs with gold iconography and toggleable password visibility.
"← Return to Heylane Overview" navigation button.
"Open Admin Console →" shortcut for system administrators.
4. Navigation & Header Branding Updates (AdminLayout.tsx & index.html)
Web Admin sidebar now features the AGI Gold Emblem and Heylane — INDUSTRI CONSOLE.
Top bar breadcrumbs updated to Heylane Industri / [Section].
Browser title set to Heylane Industri — Executive Admin Portal.
🚀 Active Service Endpoints
Service	Port / URL	Status
Heylane Landing & Field App	http://localhost:8081	Live (HTTP 200)
Heylane Admin Web Console	http://localhost:5173/login	Live (HTTP 200)
Backend API & Database	http://localhost:5000/health	UP (PostgreSQL Connected)