/*
  # Add Business Identity and Signature Fields

  1. Business Identity Enhancements
    - Add country field to businesses table
    - Add business_registration_number (optional)
    - Add vat_tax_number (optional)
    - Add bank_name field
    - Add bank_account_number field
    - Add bank_swift_code field
    - Add payment_instructions text field

  2. Signature Enhancements
    - Add include_signature_automatically boolean to user_profiles
    - Signature field already exists in user_profiles table

  3. Changes
    - All new fields are nullable/optional
    - No breaking changes to existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'country'
  ) THEN
    ALTER TABLE businesses ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'business_registration_number'
  ) THEN
    ALTER TABLE businesses ADD COLUMN business_registration_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'vat_tax_number'
  ) THEN
    ALTER TABLE businesses ADD COLUMN vat_tax_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE businesses ADD COLUMN bank_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'bank_account_number'
  ) THEN
    ALTER TABLE businesses ADD COLUMN bank_account_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'bank_swift_code'
  ) THEN
    ALTER TABLE businesses ADD COLUMN bank_swift_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'payment_instructions'
  ) THEN
    ALTER TABLE businesses ADD COLUMN payment_instructions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'include_signature_automatically'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN include_signature_automatically boolean DEFAULT false;
  END IF;
END $$;
