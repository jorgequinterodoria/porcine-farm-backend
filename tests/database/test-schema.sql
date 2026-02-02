-- Test database schema for isolated testing
-- This file creates a clean schema for test database

-- Drop existing test schema if it exists
DROP SCHEMA IF EXISTS test_schema CASCADE;
CREATE SCHEMA test_schema;

-- Create test tables with simplified structure
-- These are minimal versions of production tables for testing

-- Test tenants table
CREATE TABLE test_schema.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(50) DEFAULT 'active',
    max_users INTEGER DEFAULT 5,
    max_animals INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Test users table
CREATE TABLE test_schema.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES test_schema.tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'operator',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- Test facilities table
CREATE TABLE test_schema.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES test_schema.tenants(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Test pens table
CREATE TABLE test_schema.pens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES test_schema.tenants(id),
    facility_id UUID REFERENCES test_schema.facilities(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, code)
);

-- Test animals table
CREATE TABLE test_schema.animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES test_schema.tenants(id),
    internal_code VARCHAR(100) NOT NULL,
    identification_number VARCHAR(255),
    electronic_id VARCHAR(255),
    visual_id VARCHAR(255),
    sex VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    birth_weight DECIMAL(10,2),
    current_weight DECIMAL(10,2),
    current_status VARCHAR(50) DEFAULT 'active',
    stage VARCHAR(50) DEFAULT 'nursery',
    genetic_line VARCHAR(255),
    purpose VARCHAR(255),
    origin VARCHAR(255),
    acquisition_cost DECIMAL(10,2),
    current_pen_id UUID REFERENCES test_schema.pens(id),
    mother_id UUID REFERENCES test_schema.animals(id),
    father_id UUID REFERENCES test_schema.animals(id),
    breed_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, internal_code)
);

-- Create indexes for better test performance
CREATE INDEX test_schema_users_tenant_id_idx ON test_schema.users(tenant_id);
CREATE INDEX test_schema_animals_tenant_id_idx ON test_schema.animals(tenant_id);
CREATE INDEX test_schema_animals_internal_code_idx ON test_schema.animals(internal_code);
CREATE INDEX test_schema_animals_current_status_idx ON test_schema.animals(current_status);
CREATE INDEX test_schema_pens_tenant_id_idx ON test_schema.pens(tenant_id);
CREATE INDEX test_schema_facilities_tenant_id_idx ON test_schema.facilities(tenant_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA test_schema TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA test_schema TO test_user;