/*
  # Add Theme Preference to User Profiles

  1. Changes
    - Add `theme_preference` column to `user_profiles` table
      - Type: text with constraint (light, dark, system)
      - Default: 'system'
      - Not null
  
  2. Notes
    - This allows users to customize app appearance
    - System option respects device theme preference
    - Existing users will default to 'system' theme
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN theme_preference text DEFAULT 'system' NOT NULL
    CHECK (theme_preference IN ('light', 'dark', 'system'));
  END IF;
END $$;
