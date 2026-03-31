/*
  # Add Currency Field to Documents Table

  1. Changes
    - Add `currency` column to `documents` table
      - Type: text (currency code like ZAR, USD, EUR, GBP)
      - Default: 'ZAR' (fallback default)
      - Stores the currency used for this specific invoice
    
  2. Data Migration
    - Backfill existing documents with their business's default_currency
    - If business currency is not set, use 'ZAR' as default
  
  3. Purpose
    - Enable per-invoice currency tracking
    - Each invoice stores its own currency for display and calculations
    - Supports multi-currency invoicing per client
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'currency'
  ) THEN
    ALTER TABLE documents ADD COLUMN currency text DEFAULT 'ZAR';
  END IF;
END $$;

UPDATE documents d
SET currency = COALESCE(
  (SELECT b.default_currency FROM businesses b WHERE b.id = d.business_id LIMIT 1),
  'ZAR'
)
WHERE currency = 'ZAR' OR currency IS NULL;
