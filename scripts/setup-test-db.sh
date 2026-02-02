#!/bin/bash

# Test database setup script
# This script sets up the test database for automated testing

set -e

echo "🔧 Setting up test database..."

# Database configuration
DB_NAME="granja_test"
DB_USER="test_user"
DB_PASSWORD="test_password"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Connect to PostgreSQL and create test database if it doesn't exist
echo "📦 Creating test database if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME;" || true

# Create test user if it doesn't exist
echo "👤 Creating test user if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP USER IF EXISTS $DB_USER;" || true
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || true
psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true

# Set test database URL
export DATABASE_TEST_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo "✅ Test database setup complete!"
echo "📊 Database URL: $DATABASE_TEST_URL"

# Run Prisma migrations on test database
echo "🔄 Running Prisma migrations on test database..."
cd "$(dirname "$0")/.."
npx prisma migrate deploy --skip-generate
npx prisma generate

echo "🎉 Test database is ready for testing!"