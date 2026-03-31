/*
  # Add Client Currency Field

  1. Changes
    - Add `client_currency` column to `clients` table
      - Type: text (currency code like ZAR, USD, EUR, GBP)
      - Default: 'ZAR' (fallback default)
      - Allows users to set preferred billing currency per client
    
  2. Data Migration
    - Backfill existing clients with their business's default_currency
    - If business currency is not set, use 'ZAR' as default
  
  3. Purpose
    - Enable per-client currency support for invoices
    - Client invoices will use client_currency instead of business default_currency
    - Business default_currency remains unchanged as account default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'client_currency'
  ) THEN
    ALTER TABLE clients ADD COLUMN client_currency text DEFAULT 'ZAR';
  END IF;
END $$;

UPDATE clients c
SET client_currency = COALESCE(
  (SELECT b.default_currency FROM businesses b WHERE b.user_id = c.user_id LIMIT 1),
  'ZAR'
)
WHERE client_currency = 'ZAR' OR client_currency IS NULL;
