-- Migration script to ensure all necessary tables exist for the Casa de Cambios system
-- Run this in the Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create User Sessions Table (Fixed: relation "user_sessions" does not exist)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References auth.users or public.users depending on setup. Assuming public.users for now or loose coupling.
    refresh_token TEXT NOT NULL,
    jti TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- 3. Create Global Rate Table (Fixed: column "cop_rate" does not exist)
CREATE TABLE IF NOT EXISTS global_rate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate DECIMAL(10, 2), -- Legacy support
    cop_rate DECIMAL(10, 2), -- New standard
    bob_rate DECIMAL(10, 2), -- New standard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

-- Insert default rate if empty
INSERT INTO global_rate (rate, cop_rate, bob_rate)
SELECT 7300, 7300, 0
WHERE NOT EXISTS (SELECT 1 FROM global_rate);

-- 4. Create Collaborators Table
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    base_pct DECIMAL(5, 2) DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    total_commission_usd DECIMAL(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default collaborator if empty
INSERT INTO collaborators (name, base_pct)
SELECT 'Colaborador General', 1.0
WHERE NOT EXISTS (SELECT 1 FROM collaborators);

-- 5. Create Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    total_volume_usd DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT,
    collaborator_name TEXT,
    usd_total DECIMAL(12, 2) NOT NULL,
    commission DECIMAL(12, 2) DEFAULT 0,
    usd_net DECIMAL(12, 2) GENERATED ALWAYS AS (usd_total - commission) STORED,
    exchange_rate DECIMAL(10, 2) NOT NULL,
    amount_gs DECIMAL(15, 2) GENERATED ALWAYS AS ((usd_total - commission) * exchange_rate) STORED,
    status TEXT DEFAULT 'completed',
    chat_id TEXT,
    idempotency_key TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- 7. System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL, -- 'info', 'warn', 'error'
    component TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
