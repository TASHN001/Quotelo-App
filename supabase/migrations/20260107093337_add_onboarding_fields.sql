/*
  # Add Onboarding Fields to User Profiles

  ## Overview
  This migration adds fields to the user_profiles table to support the onboarding flow.

  ## Changes
  
  1. **user_profiles table modifications**
     - Add `onboarding_complete` (boolean, default false) - tracks if user has completed onboarding
     - Add `phone` (text, optional) - stores user's phone number

  ## Notes
  - Uses IF NOT EXISTS to safely add columns without errors if they already exist
  - Existing records will have onboarding_complete set to false by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_complete'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_complete boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;
END $$;