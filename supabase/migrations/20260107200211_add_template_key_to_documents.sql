/*
  # Add template_key to documents table

  ## Changes
  - Add template_key column to documents table to store the selected template identifier
  - This allows the system to remember which template was used for each document
  - The field is optional (nullable) as existing documents may not have a template selected

  ## Notes
  - Uses IF NOT EXISTS check to prevent errors if column already exists
  - No data migration needed as this is a new feature
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'template_key'
  ) THEN
    ALTER TABLE documents ADD COLUMN template_key text;
  END IF;
END $$;
