#!/bin/sh
set -e

DOMAIN="${DOMAIN:-industri.heylane.in}"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

# Ensure certbot webroot exists
mkdir -p /var/www/certbot
mkdir -p "$CERT_DIR"

# If SSL certificate does not exist, generate dummy certificate to allow Nginx to start
if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
    echo "==> No SSL certificate found for $DOMAIN. Generating temporary certificate..."
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" \
        -subj "/CN=$DOMAIN"
    echo "==> Temporary certificate generated. Nginx is ready for Let's Encrypt verification."
fi

exec nginx -g "daemon off;"

