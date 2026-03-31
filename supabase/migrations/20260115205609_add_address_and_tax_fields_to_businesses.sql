/*
  # Add Address and Tax Fields to Businesses Table

  1. Changes to businesses table
    - Add `address_line1` (text, required for complete address)
    - Add `address_line2` (text, optional for suite/unit numbers)
    - Add `city` (text, required)
    - Add `state` (text, optional as some countries don't use states)
    - Add `postal_code` (text, required)
    - Add `tax_number` (text, optional for business tax ID)
    - Add `vat_number` (text, optional for VAT registration)
    - Add `updated_at` (timestamptz, tracks last modification)

  2. Notes
    - All new fields allow NULL for backward compatibility with existing records
    - updated_at defaults to now() and will be used to track changes
*/

-- Add address fields to businesses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'address_line1'
  ) THEN
    ALTER TABLE businesses ADD COLUMN address_line1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'address_line2'
  ) THEN
    ALTER TABLE businesses ADD COLUMN address_line2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'city'
  ) THEN
    ALTER TABLE businesses ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'state'
  ) THEN
    ALTER TABLE businesses ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE businesses ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'tax_number'
  ) THEN
    ALTER TABLE businesses ADD COLUMN tax_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'vat_number'
  ) THEN
    ALTER TABLE businesses ADD COLUMN vat_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE businesses ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;