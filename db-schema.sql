-- This would be executed in Supabase SQL Editor

-- Make sure we have uuid functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update the tickets table
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id INTEGER,
    event_name TEXT,
    owner_address TEXT,
    owner_name TEXT,
    price NUMERIC,
    category TEXT,
    token_uri TEXT,
    token_id NUMERIC,
    purchase_date TIMESTAMP DEFAULT now(),
    seat_info TEXT,
    for_sale BOOLEAN DEFAULT false
);

-- Create index for faster lookup by owner
CREATE INDEX IF NOT EXISTS idx_tickets_owner_address ON tickets(owner_address);

-- Create index for faster lookup by event
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
