# Production Docker Deployment Guide for `industri.heylane.in`

This project is completely pre-configured for automated Docker deployment under your domain:
**`industri.heylane.in`**

---

## 🌐 1. DNS Configuration (Do this first)

In your DNS provider (Cloudflare, GoDaddy, Namecheap, Hostinger, AWS Route53, etc.):

1. Add an **`A` record**:
   - **Type:** `A`
   - **Name / Host:** `industri` (or `industri.heylane.in`)
   - **IPv4 Address:** `<Your_Server_Public_IP>`
   - **TTL:** Auto (or 300)

*(Optional: If you also want `admin.industri.heylane.in`)*:
2. Add a second **`A` record**:
   - **Type:** `A`
   - **Name / Host:** `admin.industri` (or `admin.industri.heylane.in`)
   - **IPv4 Address:** `<Your_Server_Public_IP>`

---

## 🚀 2. Quick 1-Command Deployment

### 🔌 Assigned Server Host Ports:
To avoid conflicts with any other Docker apps running on your server, the stack uses these assigned ports:
* **Frontend Web (Nginx Gateway):** `http://<SERVER_IP>:8012` (Host port `8012` → container port `80`)
* **Backend API (Direct):** `http://<SERVER_IP>:5007` (Host port `5007` → container port `5000`)
* **PostgreSQL Database (Direct Host Access):** `<SERVER_IP>:5441` (Host port `5441` → container port `5432`)
* **SSL / HTTPS:** Port `443` (for `industri.heylane.in`)

On your server/VPS (Ubuntu, Debian, CentOS, or Windows):

```bash
# 1. Clone or copy the project files to your server
git clone <your_repo_url> /opt/industri-app
cd /opt/industri-app

# 2. Start all containers (Database, API, Web Gateway & Certbot)
docker compose --env-file .env.production up -d --build
```

---

## 🔒 3. Activate Free SSL / HTTPS (Let's Encrypt)

Once your DNS `A` record has propagated (points to your server IP):

```bash
# Make the SSL script executable and run it:
chmod +x docker/init-ssl.sh
./docker/init-ssl.sh industri.heylane.in your-email@heylane.in
```

*(On Windows PowerShell, run: `.\docker\init-ssl.ps1 -Domain industri.heylane.in -Email your-email@heylane.in`)*

The script will automatically:
1. Verify the Nginx gateway webroot.
2. Request a 4096-bit RSA certificate from Let's Encrypt.
3. Replace the temporary certificate.
4. Reload Nginx with full TLS 1.2 / 1.3 encryption.
5. The `industri_certbot` container will automatically renew the certificate every 60 days in the background.

---

## 🗺️ 4. Architecture & URL Routing on `industri.heylane.in`

| Endpoint | Destination Service | Description |
| :--- | :--- | :--- |
| **`https://industri.heylane.in/`** | Seller / Staff Web PWA | Field sales reps mobile-friendly app for shop registration, replenishment reorders, and cash memo viewing |
| **`https://industri.heylane.in/admin`** | Admin Web Portal | Executive Dashboard, Store Master, Field Sales tracking, Products SKU catalog, and Billing ledger with WhatsApp dispatch |
| **`https://industri.heylane.in/api/v1`** | Node.js Backend API | Secured REST API with Prisma ORM and JWT authentication |
| **`https://industri.heylane.in/health`** | Health Monitor | Returns JSON status: `UP` and database: `CONNECTED` |
| **`https://admin.industri.heylane.in`** | Admin Subdomain | *(Optional)* Direct subdomain routing straight into the Admin portal |

---

## 🔑 5. Default Credentials

- **Admin Web Portal:** [https://industri.heylane.in/admin](https://industri.heylane.in/admin)
  - **Username:** `admin`
  - **Password:** `AdminPassword@123` *(configured in `.env.production`)*
- **Staff / Seller Panel:** [https://industri.heylane.in](https://industri.heylane.in)
  - **Username:** Any sales representative created in the Admin Panel
- **PostgreSQL Database:**
  - **Database:** `retailer_db`
  - **User:** `postgres`
  - **Password:** `industri_secure_db_pass_2026`

---

## 🛠️ 6. Useful Maintenance Commands

```bash
# View live container logs
docker compose logs -f

# View backend API logs specifically
docker compose logs -f api

# View Nginx access & error logs
docker compose logs -f web

# Restart all services
docker compose restart

# Database backup to SQL file
docker exec -t industri_postgres pg_dumpall -c -U postgres > backup_$(date +%Y%m%d).sql

# Database restore from SQL file
cat backup_20261106.sql | docker exec -i industri_postgres psql -U postgres -d retailer_db

# Stop all containers
docker compose down
```
