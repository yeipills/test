-- LiquiVerde Database Initialization Script
-- This script runs when PostgreSQL container starts for the first time

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create indexes for better text search performance
-- (Tables are created by SQLAlchemy, this adds additional optimizations)

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE liquiverde TO liquiverde;

-- Create a function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'LiquiVerde database initialized successfully';
END $$;
