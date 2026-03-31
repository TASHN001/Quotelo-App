/*
  # Add Signature Column to User Profiles

  1. Changes
    - Add `signature_data_url` column to `user_profiles` table
      - Stores base64-encoded PNG signature data
      - Nullable (users can have no signature)
      - Text type to accommodate data URLs

  2. Notes
    - This allows users to create and save handwritten signatures
    - Signatures will be displayed on invoices when available
    - Uses data URLs for simplicity (no separate file storage needed)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'signature_data_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN signature_data_url text;
  END IF;
END $$;
