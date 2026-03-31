/*
  # Invoice Status and Automation System

  1. Schema Changes
    - Update documents table status constraint to include 'overdue'
    - Add last_reminder_sent_at timestamp to documents
    - Add paid_date timestamp to track when invoice was paid
    - Add indexes on due_date and status for performance
    
  2. New Tables
    - `invoice_reminders`
      - Tracks reminder history for each invoice
      - Fields: id, document_id, reminder_type, sent_at, dismissed_at
      
    - `user_reminder_settings`
      - User preferences for automatic reminders
      - Fields: user_id, auto_followup_enabled, reminder_frequency, email_reminders_enabled
      
  3. Security
    - Enable RLS on new tables
    - Users can only access their own reminders and settings
    
  4. Important Notes
    - Status 'overdue' is calculated dynamically but can be set manually
    - Reminder system is opt-in and fully transparent to users
    - All automation is optional and user-controlled
*/

-- Add new columns to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'last_reminder_sent_at'
  ) THEN
    ALTER TABLE documents ADD COLUMN last_reminder_sent_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'paid_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN paid_date timestamptz;
  END IF;
END $$;

-- Drop the old constraint and add new one with 'overdue'
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check 
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_due_date ON documents(due_date);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents(user_id, status);

-- Create invoice_reminders table
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
  ON invoice_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = invoice_reminders.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reminders for their documents"
  ON invoice_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = invoice_reminders.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their document reminders"
  ON invoice_reminders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = invoice_reminders.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Create user_reminder_settings table
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
  ON user_reminder_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder settings"
  ON user_reminder_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminder settings"
  ON user_reminder_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster reminder lookups
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_document ON invoice_reminders(document_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_sent_at ON invoice_reminders(sent_at);