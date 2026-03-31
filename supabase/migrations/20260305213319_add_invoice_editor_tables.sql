/*
  # Invoice Editor Schema Extensions

  1. New Tables
    - `saved_line_items` - User's frequently used line items
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Item description
      - `default_quantity` (numeric) - Default quantity
      - `default_unit_price` (numeric) - Default unit price
      - `default_tax_rate` (numeric) - Default tax rate percentage
      - `category` (text) - Optional category for grouping
      - `is_archived` (boolean) - Soft delete flag
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `document_versions` - Version history for documents
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documents)
      - `version_number` (integer) - Sequential version number
      - `snapshot` (jsonb) - Full document state at time of save
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

  2. Extended Document Fields
    - Adding ship_to fields, PO number, discount fields, partial payments to documents table

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Saved Line Items Table
CREATE TABLE IF NOT EXISTS saved_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  default_quantity numeric DEFAULT 1,
  default_unit_price numeric DEFAULT 0,
  default_tax_rate numeric DEFAULT 0,
  category text,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved line items"
  ON saved_line_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved line items"
  ON saved_line_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved line items"
  ON saved_line_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved line items"
  ON saved_line_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(document_id, version_number)
);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own document versions"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own document versions"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own document versions"
  ON document_versions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Add extended fields to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'ship_to_name'
  ) THEN
    ALTER TABLE documents ADD COLUMN ship_to_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'ship_to_address'
  ) THEN
    ALTER TABLE documents ADD COLUMN ship_to_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'ship_to_phone'
  ) THEN
    ALTER TABLE documents ADD COLUMN ship_to_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'show_ship_to'
  ) THEN
    ALTER TABLE documents ADD COLUMN show_ship_to boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'po_number'
  ) THEN
    ALTER TABLE documents ADD COLUMN po_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE documents ADD COLUMN discount_type text DEFAULT 'percentage';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'discount_value'
  ) THEN
    ALTER TABLE documents ADD COLUMN discount_value numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'discount_applied_before_tax'
  ) THEN
    ALTER TABLE documents ADD COLUMN discount_applied_before_tax boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'tax_type'
  ) THEN
    ALTER TABLE documents ADD COLUMN tax_type text DEFAULT 'percentage';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE documents ADD COLUMN tax_rate numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'global_tax'
  ) THEN
    ALTER TABLE documents ADD COLUMN global_tax boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'partial_payments_total'
  ) THEN
    ALTER TABLE documents ADD COLUMN partial_payments_total numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'amount_due'
  ) THEN
    ALTER TABLE documents ADD COLUMN amount_due numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'terms_conditions'
  ) THEN
    ALTER TABLE documents ADD COLUMN terms_conditions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'currency_display_format'
  ) THEN
    ALTER TABLE documents ADD COLUMN currency_display_format text DEFAULT 'symbol_first';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'custom_logo_url'
  ) THEN
    ALTER TABLE documents ADD COLUMN custom_logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'custom_signature_url'
  ) THEN
    ALTER TABLE documents ADD COLUMN custom_signature_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'last_auto_save'
  ) THEN
    ALTER TABLE documents ADD COLUMN last_auto_save timestamptz;
  END IF;
END $$;

-- Add sort_order and is_archived to document_line_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_line_items' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE document_line_items ADD COLUMN sort_order integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_line_items' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE document_line_items ADD COLUMN is_archived boolean DEFAULT false;
  END IF;
END $$;

-- Add default_terms_conditions to businesses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'default_terms_conditions'
  ) THEN
    ALTER TABLE businesses ADD COLUMN default_terms_conditions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'default_tax_rate'
  ) THEN
    ALTER TABLE businesses ADD COLUMN default_tax_rate numeric DEFAULT 15;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_line_items_user_id ON saved_line_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_line_items_category ON saved_line_items(category);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);