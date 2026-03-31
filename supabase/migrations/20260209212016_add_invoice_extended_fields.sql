/*
  # Add Extended Invoice Fields

  1. Changes
    - Add `client_phone` column to store client phone number
    - Add `client_address` column to store client billing address
    - Add `reference` column for invoice reference or project number
    - Add `payment_details` column to store payment information (JSON)
    - Add `payment_terms` column to store payment terms (JSON)
    - Add `footer_message` column for custom footer messages
  
  2. Notes
    - All new columns are optional (nullable)
    - payment_details and payment_terms stored as TEXT (JSON stringified)
    - These fields enhance invoice professionalism and completeness
*/

-- Add client contact fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'client_phone'
  ) THEN
    ALTER TABLE documents ADD COLUMN client_phone TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'client_address'
  ) THEN
    ALTER TABLE documents ADD COLUMN client_address TEXT;
  END IF;
END $$;

-- Add invoice reference field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'reference'
  ) THEN
    ALTER TABLE documents ADD COLUMN reference TEXT;
  END IF;
END $$;

-- Add payment details field (stored as JSON text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'payment_details'
  ) THEN
    ALTER TABLE documents ADD COLUMN payment_details TEXT;
  END IF;
END $$;

-- Add payment terms field (stored as JSON text)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE documents ADD COLUMN payment_terms TEXT;
  END IF;
END $$;

-- Add footer message field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'footer_message'
  ) THEN
    ALTER TABLE documents ADD COLUMN footer_message TEXT;
  END IF;
END $$;
