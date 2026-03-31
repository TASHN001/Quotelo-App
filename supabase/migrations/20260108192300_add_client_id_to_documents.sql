/*
  # Add Client ID to Documents Table

  1. Changes
    - Add `client_id` column to documents table (uuid, nullable)
    - Add foreign key constraint referencing clients table
    - Add index on `client_id` for fast client-based queries
    - On delete set null to preserve documents if client is deleted

  2. Notes
    - This allows documents to be linked to clients
    - Nullable to support existing documents without clients
    - Index improves query performance when fetching invoices by client
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN client_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_documents_client_id'
  ) THEN
    ALTER TABLE documents
    ADD CONSTRAINT fk_documents_client_id
    FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE SET NULL;
  END IF;
END $$;
