-- ============================================================
-- QUOTELO DATABASE SETUP
-- Paste this entire file into the Supabase SQL Editor
-- and click RUN. Do it once on a fresh project.
-- ============================================================


-- ============================================================
-- MIGRATION 1: Core Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  logo_url text,
  signature_url text,
  default_currency text NOT NULL DEFAULT 'ZAR',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own businesses"
  ON businesses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own businesses"
  ON businesses FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own businesses"
  ON businesses FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Document Templates
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
  ON document_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only service role can insert templates"
  ON document_templates FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Only service role can update templates"
  ON document_templates FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

-- Documents
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
  ON documents FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Document Line Items
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
  ON document_line_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_line_items.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can insert own document line items"
  ON document_line_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_line_items.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can update own document line items"
  ON document_line_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_line_items.document_id AND documents.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_line_items.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can delete own document line items"
  ON document_line_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_line_items.document_id AND documents.user_id = auth.uid()));

-- Chat Threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat threads"
  ON chat_threads FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat threads"
  ON chat_threads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat threads"
  ON chat_threads FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chat threads"
  ON chat_threads FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('system', 'assistant', 'user')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM chat_threads WHERE chat_threads.id = chat_messages.thread_id AND chat_threads.user_id = auth.uid()));

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM chat_threads WHERE chat_threads.id = chat_messages.thread_id AND chat_threads.user_id = auth.uid()));

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM chat_threads WHERE chat_threads.id = chat_messages.thread_id AND chat_threads.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM chat_threads WHERE chat_threads.id = chat_messages.thread_id AND chat_threads.user_id = auth.uid()));

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM chat_threads WHERE chat_threads.id = chat_messages.thread_id AND chat_threads.user_id = auth.uid()));


-- ============================================================
-- MIGRATION 2: Avatar columns
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_seed') THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_seed text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_style') THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_style text NOT NULL DEFAULT 'illustrated';
  END IF;
END $$;


-- ============================================================
-- MIGRATION 3: Onboarding fields
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'onboarding_complete') THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_complete boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;
END $$;


-- ============================================================
-- MIGRATION 4: Template key on documents
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'template_key') THEN
    ALTER TABLE documents ADD COLUMN template_key text;
  END IF;
END $$;


-- ============================================================
-- MIGRATION 5: Storage bucket for business assets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('business-assets', 'business-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

DROP POLICY IF EXISTS "Anyone can view business assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Anyone can view business assets"
  ON storage.objects FOR SELECT TO public USING (bucket_id = 'business-assets');

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'business-assets' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ============================================================
-- MIGRATION 6: Date fields on documents
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'issue_date') THEN
    ALTER TABLE documents ADD COLUMN issue_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'due_date') THEN
    ALTER TABLE documents ADD COLUMN due_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;


-- ============================================================
-- MIGRATION 7: Clients table
-- ============================================================
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
  ON clients FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clients"
  ON clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ============================================================
-- MIGRATION 8: client_id on documents
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'client_id') THEN
    ALTER TABLE documents ADD COLUMN client_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_documents_client_id') THEN
    ALTER TABLE documents ADD CONSTRAINT fk_documents_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================
-- MIGRATION 9: Selected template on user_profiles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'selected_template_key') THEN
    ALTER TABLE user_profiles ADD COLUMN selected_template_key text DEFAULT 'minimal';
  END IF;
END $$;


-- ============================================================
-- MIGRATION 10: Signature on user_profiles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'signature_data_url') THEN
    ALTER TABLE user_profiles ADD COLUMN signature_data_url text;
  END IF;
END $$;


-- ============================================================
-- MIGRATION 11: Address and tax fields on businesses
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'address_line1') THEN
    ALTER TABLE businesses ADD COLUMN address_line1 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'address_line2') THEN
    ALTER TABLE businesses ADD COLUMN address_line2 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'city') THEN
    ALTER TABLE businesses ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'state') THEN
    ALTER TABLE businesses ADD COLUMN state text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'postal_code') THEN
    ALTER TABLE businesses ADD COLUMN postal_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'tax_number') THEN
    ALTER TABLE businesses ADD COLUMN tax_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'vat_number') THEN
    ALTER TABLE businesses ADD COLUMN vat_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'updated_at') THEN
    ALTER TABLE businesses ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;


-- ============================================================
-- MIGRATION 12: Theme preference on user_profiles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'theme_preference') THEN
    ALTER TABLE user_profiles ADD COLUMN theme_preference text DEFAULT 'system' NOT NULL CHECK (theme_preference IN ('light', 'dark', 'system'));
  END IF;
END $$;


-- ============================================================
-- MIGRATION 13: Extended invoice fields on documents
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'client_phone') THEN ALTER TABLE documents ADD COLUMN client_phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'client_address') THEN ALTER TABLE documents ADD COLUMN client_address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'reference') THEN ALTER TABLE documents ADD COLUMN reference TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'payment_details') THEN ALTER TABLE documents ADD COLUMN payment_details TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'payment_terms') THEN ALTER TABLE documents ADD COLUMN payment_terms TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'footer_message') THEN ALTER TABLE documents ADD COLUMN footer_message TEXT; END IF;
END $$;


-- ============================================================
-- MIGRATION 14: User template preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS user_template_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_key text NOT NULL,
  is_favorite boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_template UNIQUE (user_id, template_key)
);

CREATE INDEX IF NOT EXISTS idx_user_template_preferences_user_id ON user_template_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_template_preferences_default ON user_template_preferences(user_id, is_default) WHERE is_default = true;

ALTER TABLE user_template_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own template preferences"
  ON user_template_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own template preferences"
  ON user_template_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template preferences"
  ON user_template_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own template preferences"
  ON user_template_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE user_template_preferences SET is_default = false, updated_at = now()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default ON user_template_preferences;
CREATE TRIGGER trigger_ensure_single_default
  BEFORE INSERT OR UPDATE ON user_template_preferences
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_template();


-- ============================================================
-- MIGRATION 15: Business identity and signature fields
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'business_registration_number') THEN ALTER TABLE businesses ADD COLUMN business_registration_number text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'vat_tax_number') THEN ALTER TABLE businesses ADD COLUMN vat_tax_number text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'bank_name') THEN ALTER TABLE businesses ADD COLUMN bank_name text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'bank_account_number') THEN ALTER TABLE businesses ADD COLUMN bank_account_number text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'bank_swift_code') THEN ALTER TABLE businesses ADD COLUMN bank_swift_code text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'payment_instructions') THEN ALTER TABLE businesses ADD COLUMN payment_instructions text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'include_signature_automatically') THEN ALTER TABLE user_profiles ADD COLUMN include_signature_automatically boolean DEFAULT false; END IF;
END $$;


-- ============================================================
-- MIGRATION 16: Client currency
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'client_currency') THEN
    ALTER TABLE clients ADD COLUMN client_currency text DEFAULT 'ZAR';
  END IF;
END $$;


-- ============================================================
-- MIGRATION 17: Currency on documents
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'currency') THEN
    ALTER TABLE documents ADD COLUMN currency text DEFAULT 'ZAR';
  END IF;
END $$;


-- ============================================================
-- MIGRATION 18: Industry fields on businesses
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'industry_group') THEN
    ALTER TABLE businesses ADD COLUMN industry_group text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'industry_type') THEN
    ALTER TABLE businesses ADD COLUMN industry_type text;
  END IF;
END $$;

UPDATE businesses SET industry_group = 'Other' WHERE industry_group IS NULL;
ALTER TABLE businesses ALTER COLUMN industry_group SET DEFAULT 'Other';
ALTER TABLE businesses ALTER COLUMN industry_group SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_industry_group ON businesses(industry_group);
CREATE INDEX IF NOT EXISTS idx_businesses_industry_type ON businesses(industry_type) WHERE industry_type IS NOT NULL;


-- ============================================================
-- MIGRATION 19: Invoice status overdue + reminders
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'last_reminder_sent_at') THEN
    ALTER TABLE documents ADD COLUMN last_reminder_sent_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'paid_date') THEN
    ALTER TABLE documents ADD COLUMN paid_date timestamptz;
  END IF;
END $$;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_documents_due_date ON documents(due_date);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents(user_id, status);

CREATE TABLE IF NOT EXISTS invoice_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('overdue_3_days', 'overdue_7_days', 'overdue_14_days', 'manual')),
  sent_at timestamptz DEFAULT now(),
  dismissed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminders for their documents"
  ON invoice_reminders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = invoice_reminders.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can create reminders for their documents"
  ON invoice_reminders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = invoice_reminders.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can update their document reminders"
  ON invoice_reminders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = invoice_reminders.document_id AND documents.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS user_reminder_settings (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  auto_followup_enabled boolean DEFAULT false,
  reminder_frequency integer DEFAULT 3 CHECK (reminder_frequency IN (3, 7, 14)),
  email_reminders_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminder settings"
  ON user_reminder_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder settings"
  ON user_reminder_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminder settings"
  ON user_reminder_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_invoice_reminders_document ON invoice_reminders(document_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_sent_at ON invoice_reminders(sent_at);


-- ============================================================
-- MIGRATION 20: Country fields on businesses
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'country_code') THEN ALTER TABLE businesses ADD COLUMN country_code text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'country_flag') THEN ALTER TABLE businesses ADD COLUMN country_flag text; END IF;
END $$;


-- ============================================================
-- MIGRATION 21: EULA acceptance
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'eula_accepted') THEN ALTER TABLE user_profiles ADD COLUMN eula_accepted boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'eula_accepted_at') THEN ALTER TABLE user_profiles ADD COLUMN eula_accepted_at timestamptz; END IF;
END $$;


-- ============================================================
-- MIGRATION 22: Invoice editor — saved line items, document versions, extended fields
-- ============================================================

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
  ON saved_line_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved line items"
  ON saved_line_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved line items"
  ON saved_line_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved line items"
  ON saved_line_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

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
  ON document_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_versions.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can create own document versions"
  ON document_versions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM documents WHERE documents.id = document_versions.document_id AND documents.user_id = auth.uid()));

CREATE POLICY "Users can delete own document versions"
  ON document_versions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_versions.document_id AND documents.user_id = auth.uid()));

-- Extended document fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'ship_to_name') THEN ALTER TABLE documents ADD COLUMN ship_to_name text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'ship_to_address') THEN ALTER TABLE documents ADD COLUMN ship_to_address text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'ship_to_phone') THEN ALTER TABLE documents ADD COLUMN ship_to_phone text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'show_ship_to') THEN ALTER TABLE documents ADD COLUMN show_ship_to boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'po_number') THEN ALTER TABLE documents ADD COLUMN po_number text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'discount_type') THEN ALTER TABLE documents ADD COLUMN discount_type text DEFAULT 'percentage'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'discount_value') THEN ALTER TABLE documents ADD COLUMN discount_value numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'discount_applied_before_tax') THEN ALTER TABLE documents ADD COLUMN discount_applied_before_tax boolean DEFAULT true; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'tax_type') THEN ALTER TABLE documents ADD COLUMN tax_type text DEFAULT 'percentage'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'tax_rate') THEN ALTER TABLE documents ADD COLUMN tax_rate numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'global_tax') THEN ALTER TABLE documents ADD COLUMN global_tax boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'partial_payments_total') THEN ALTER TABLE documents ADD COLUMN partial_payments_total numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'amount_due') THEN ALTER TABLE documents ADD COLUMN amount_due numeric DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'terms_conditions') THEN ALTER TABLE documents ADD COLUMN terms_conditions text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'currency_display_format') THEN ALTER TABLE documents ADD COLUMN currency_display_format text DEFAULT 'symbol_first'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'custom_logo_url') THEN ALTER TABLE documents ADD COLUMN custom_logo_url text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'custom_signature_url') THEN ALTER TABLE documents ADD COLUMN custom_signature_url text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'last_auto_save') THEN ALTER TABLE documents ADD COLUMN last_auto_save timestamptz; END IF;
END $$;

-- Extended line item fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_line_items' AND column_name = 'sort_order') THEN ALTER TABLE document_line_items ADD COLUMN sort_order integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_line_items' AND column_name = 'is_archived') THEN ALTER TABLE document_line_items ADD COLUMN is_archived boolean DEFAULT false; END IF;
END $$;

-- Extended business fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'default_terms_conditions') THEN ALTER TABLE businesses ADD COLUMN default_terms_conditions text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'default_tax_rate') THEN ALTER TABLE businesses ADD COLUMN default_tax_rate numeric DEFAULT 15; END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_line_items_user_id ON saved_line_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_line_items_category ON saved_line_items(category);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);


-- ============================================================
-- MIGRATION 23: Language on user_profiles (used by app)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'language') THEN
    ALTER TABLE user_profiles ADD COLUMN language text DEFAULT 'en';
  END IF;
END $$;
