/*
  # Add Date Fields to Documents Table

  1. Changes
    - Add `issue_date` column to documents table (date, required)
    - Add `due_date` column to documents table (date, required)

  2. Notes
    - These fields are required for invoice functionality
    - issue_date represents when the invoice was created
    - due_date represents when payment is due
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'issue_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN issue_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN due_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;
