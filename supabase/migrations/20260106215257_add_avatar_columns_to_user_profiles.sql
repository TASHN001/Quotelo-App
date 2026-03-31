/*
  # Add Avatar Columns to User Profiles

  ## Overview
  Adds avatar customization fields to the user_profiles table to support
  the avatar generation and display functionality.

  ## Changes Made
  
  1. **New Columns Added to user_profiles**
     - `avatar_seed` (text) - Unique seed for generating consistent avatar traits
     - `avatar_style` (text) - Avatar style preference (illustrated, minimal, etc.)
  
  ## Notes
  - Both columns are added with IF NOT EXISTS logic to prevent errors if already present
  - Default avatar_style is set to 'illustrated'
  - Existing users will need avatar_seed populated by the application
*/

-- Add avatar_seed column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_seed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_seed text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add avatar_style column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_style'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_style text NOT NULL DEFAULT 'illustrated';
  END IF;
END $$;
