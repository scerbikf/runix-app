#!/bin/bash

# Render.com deployment script
echo "Installing dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

echo "Creating SQLite database..."
touch database/database.sqlite

echo "Running migrations..."
php artisan migrate --force

echo "Caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Deployment complete!"
