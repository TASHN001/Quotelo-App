/*
  # Add Selected Template to User Profiles

  1. Changes
    - Add `selected_template_key` column to user_profiles table (text, default 'minimal')
    - This stores the user's preferred invoice template

  2. Notes
    - Defaults to 'minimal' for all users
    - Allows users to customize their default template preference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'selected_template_key'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN selected_template_key text DEFAULT 'minimal';
  END IF;
END $$;
