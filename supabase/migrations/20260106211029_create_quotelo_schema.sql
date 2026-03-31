/*
  # Create Quotelo Database Schema

  ## Overview
  This migration creates the complete database schema for the Quotelo billing application.
  All tables include Row Level Security (RLS) to ensure data privacy and security.

  ## Tables Created

  1. **user_profiles**
     - Stores user account information
     - Links to Supabase auth.users via id
     - Tracks plan tier (free/pro) for feature access
     
  2. **businesses**
     - Stores business information for each user
     - One-to-many relationship with user_profiles
     - Contains branding assets (logo, signature)
     
  3. **document_templates**
     - System and user-created templates
     - Supports tiered access (free vs pro)
     - Stores template configuration as JSON
     
  4. **documents**
     - Main invoice/document records
     - Links to user and business
     - Tracks document status and financial totals
     
  5. **document_line_items**
     - Individual line items for documents
     - Supports quantity, unit price, tax calculations
     
  6. **chat_threads**
     - Organizes chat conversations by document type
     - Links to user for conversation history
     
  7. **chat_messages**
     - Individual messages within threads
     - Supports system, assistant, and user roles
     
  ## Security
  
  All tables have RLS enabled with policies that:
  - Restrict access to authenticated users only
  - Enforce ownership checks (users can only access their own data)
  - Allow read access to system templates for all authenticated users
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text NOT NULL,
  logo_url text,
  signature_url text,
  default_currency text NOT NULL DEFAULT 'ZAR',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  template_name text NOT NULL,
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  is_free boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON document_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can insert templates"
  ON document_templates FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only service role can update templates"
  ON document_templates FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  client_name text NOT NULL,
  client_email text NOT NULL,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  tax_total numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create document_line_items table
CREATE TABLE IF NOT EXISTS document_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL DEFAULT 0,
  tax_rate numeric(5, 2) NOT NULL DEFAULT 0,
  line_total numeric(10, 2) NOT NULL DEFAULT 0
);

ALTER TABLE document_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own document line items"
  ON document_line_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_line_items.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own document line items"
  ON document_line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_line_items.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own document line items"
  ON document_line_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_line_items.document_id
      AND documents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_line_items.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own document line items"
  ON document_line_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_line_items.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Create chat_threads table
CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat threads"
  ON chat_threads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat threads"
  ON chat_threads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat threads"
  ON chat_threads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chat threads"
  ON chat_threads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('system', 'assistant', 'user')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_threads
      WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_threads
      WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_threads
      WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_threads
      WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_threads
      WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
    )
  );