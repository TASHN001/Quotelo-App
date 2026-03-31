/*
  # Add Country Fields to Businesses Table

  1. New Columns
    - `country_code` (text) - ISO2 country code (e.g., "ZA", "US", "GB")
    - `country_flag` (text) - Emoji flag representation of the country
  
  2. Notes
    - Existing `country` column is kept for backward compatibility
    - New fields allow structured country data with flags for UI display
    - Country code can be used to derive default currency and language
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE businesses ADD COLUMN country_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'country_flag'
  ) THEN
    ALTER TABLE businesses ADD COLUMN country_flag text;
  END IF;
END $$;
