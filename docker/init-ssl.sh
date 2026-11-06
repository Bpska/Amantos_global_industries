#!/bin/bash
set -e

DOMAIN="${1:-industri.heylane.in}"
EMAIL="${2:-admin@heylane.in}"

echo "========================================================="
echo "   Automated SSL Certificate Setup for $DOMAIN"
echo "========================================================="

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker daemon is not running."
    exit 1
fi

# Step 1: Start containers (Nginx starts with temporary SSL certificate)
echo "--> Step 1: Starting Docker containers..."
docker compose up -d

echo "--> Waiting for Nginx gateway to initialize..."
sleep 5

# Step 2: Request genuine certificate from Let's Encrypt
echo "--> Step 2: Requesting genuine SSL certificate from Let's Encrypt for $DOMAIN..."
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --non-interactive \
    --force-renewal" certbot

# Step 3: Reload Nginx with new certificate
echo "--> Step 3: Reloading Nginx gateway..."
docker compose exec web nginx -s reload

echo "========================================================="
echo "   ✅ SSL Certificate successfully activated!"
echo "   Staff Portal:  https://$DOMAIN"
echo "   Admin Panel:   https://$DOMAIN/admin"
echo "   Backend API:   https://$DOMAIN/api/v1"
echo "========================================================="

