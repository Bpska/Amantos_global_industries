param (
    [string]$Domain = "industri.heylane.in",
    [string]$Email = "admin@heylane.in"
)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   Automated SSL Certificate Setup for $Domain" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Step 1: Start containers
Write-Host "--> Step 1: Starting Docker containers..." -ForegroundColor Yellow
docker compose up -d

Write-Host "--> Waiting 5 seconds for Nginx gateway to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 2: Request genuine certificate from Let's Encrypt
Write-Host "--> Step 2: Requesting genuine SSL certificate from Let's Encrypt for $Domain..." -ForegroundColor Yellow
docker compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot --email $Email -d $Domain --rsa-key-size 4096 --agree-tos --non-interactive --force-renewal" certbot

# Step 3: Reload Nginx with new certificate
Write-Host "--> Step 3: Reloading Nginx gateway..." -ForegroundColor Yellow
docker compose exec web nginx -s reload

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "   ✅ SSL Certificate successfully activated!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
