-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
-- Stores user account information for authentication and identification.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts Table
-- Stores records of driving shifts, linked to a user.
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ, -- Can be NULL if the shift is currently active
    total_earnings NUMERIC(10, 2) DEFAULT 0.00,
    total_miles NUMERIC(10, 2) DEFAULT 0.00
);

-- Index on user_id for faster querying of a user's shifts
CREATE INDEX idx_shifts_user_id ON shifts(user_id);

-- Orders Table
-- Stores records of individual delivery orders, linked to a user.
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- e.g., 'doordash', 'uber'
    payout NUMERIC(10, 2) NOT NULL,
    distance NUMERIC(10, 2) NOT NULL,
    duration INTEGER, -- Estimated duration in minutes
    profit_score INTEGER CHECK (profit_score >= 1 AND profit_score <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on user_id for faster querying of a user's orders
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Mileage Logs Table
-- Stores individual trip segments for detailed mileage tracking.
CREATE TABLE mileage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_location TEXT,
    end_location TEXT,
    distance NUMERIC(10, 2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index on user_id for faster querying of a user's mileage logs
CREATE INDEX idx_mileage_logs_user_id ON mileage_logs(user_id);

-- Subscriptions Table
-- Stores user subscription plan information.
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- e.g., 'free', 'pro'
    status VARCHAR(50) NOT NULL, -- e.g., 'active', 'canceled', 'past_due'
    renewal_date TIMESTAMPTZ
);

-- Index on user_id for faster querying of a user's subscription
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
