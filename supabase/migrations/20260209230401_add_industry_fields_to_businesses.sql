/*
  # Add Industry Fields to Businesses Table

  1. Changes
    - Add `industry_group` (text, required) to businesses table
    - Add `industry_type` (text, optional) to businesses table
    - Backfill existing records with 'Other' as industry_group
    - Add index on industry_group for query performance

  2. Purpose
    - Enable two-step industry selection (group → type)
    - Support AI personalization and template customization
    - Maintain backward compatibility with existing records

  3. Notes
    - industry_group is required for all new records
    - industry_type is optional and can be NULL or empty
    - Existing businesses are set to 'Other' group with NULL type
*/

-- Add industry_group column (nullable initially for migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'industry_group'
  ) THEN
    ALTER TABLE businesses ADD COLUMN industry_group text;
  END IF;
END $$;

-- Add industry_type column (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'industry_type'
  ) THEN
    ALTER TABLE businesses ADD COLUMN industry_type text;
  END IF;
END $$;

-- Backfill existing records with 'Other' as default industry_group
UPDATE businesses
SET industry_group = 'Other'
WHERE industry_group IS NULL;

-- Now make industry_group NOT NULL with default
ALTER TABLE businesses 
  ALTER COLUMN industry_group SET DEFAULT 'Other',
  ALTER COLUMN industry_group SET NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_businesses_industry_group 
  ON businesses(industry_group);

-- Create index for industry_type when it's not null
CREATE INDEX IF NOT EXISTS idx_businesses_industry_type 
  ON businesses(industry_type) 
  WHERE industry_type IS NOT NULL;