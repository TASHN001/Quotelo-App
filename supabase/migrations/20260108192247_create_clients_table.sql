/*
  # Create Clients Table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, required) - References auth.users
      - `business_id` (uuid, optional) - References businesses table
      - `name` (text, required) - Client/company name
      - `email` (text, optional) - Client email address
      - `phone` (text, optional) - Client phone number
      - `billing_address` (text, optional) - Client billing address
      - `tax_number` (text, optional) - Client tax/VAT number
      - `notes` (text, optional) - Additional notes about client
      - `created_at` (timestamptz, default now) - Record creation timestamp
      - `updated_at` (timestamptz, default now) - Record last update timestamp

  2. Indexes
    - Index on `user_id` for fast user-based queries
    - Unique constraint on `(user_id, name)` to prevent duplicate clients per user

  3. Security
    - Enable RLS on `clients` table
    - Add policies for authenticated users to manage their own clients only
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  billing_address text,
  tax_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_name_unique ON clients(user_id, name);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
