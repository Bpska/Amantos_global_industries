# Full-Stack Deployment (Express.js + PostgreSQL + PWA Frontend)

The stack consists of 3 integrated services:
1. **PostgreSQL Database** (`industri_postgres`): PostgreSQL 16 database with user `postgres` and password `bps`.
2. **Express.js API Backend** (`industri_api`): Node.js + TypeScript + Prisma ORM on port 5000.
3. **PWA Frontend + Nginx Gateway** (`industri_web`): Reverse proxy for `/api/` requests and static web client.

---

## 1. Quick Start with Docker Compose

From the repository root on your server or local machine:

```powershell
docker compose up -d --build
```

On Linux:
```bash
docker compose up -d --build
```

---

## 2. Configuration & Credentials

- **PostgreSQL Database:**
  - **Host:** `postgres` (inside docker) or `localhost:5441` (from host)
  - **Database:** `retailer_db`
  - **User:** `postgres`
  - **Password:** `bps`

- **Initial Administrator Login:**
  - **Username:** `admin`
  - **Password:** `admin@123`

- **Port Mapping:**
  - Frontend Web & Nginx: `http://localhost:8012` (or your domain port 80/443)
  - Backend API: `http://localhost:5007` (container port 5000)
  - PostgreSQL: `localhost:5441` (container port 5432)

---

## 3. Logs and Service Management

Check running services:
```bash
docker compose ps
```

View live logs:
```bash
docker compose logs -f api
docker compose logs -f web
```

Stop services:
```bash
docker compose down
```
