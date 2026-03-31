/*
  # Add EULA Acceptance Fields to User Profiles

  ## Summary
  Adds legal compliance fields to track whether users have accepted the
  End User License Agreement (EULA) for the Quotelo platform.

  ## Changes

  ### Modified Tables
  - `user_profiles`
    - `eula_accepted` (boolean, default false) — Whether the user has accepted the EULA
    - `eula_accepted_at` (timestamptz, nullable) — Timestamp of EULA acceptance

  ## Business Logic
  - New accounts start with eula_accepted = false
  - On first login after account creation, users are shown the EULA screen
  - Acceptance is recorded with timestamp for legal auditing purposes
  - Users cannot access the app until EULA is accepted

  ## Notes
  - Existing accounts will have eula_accepted = false and will be shown the EULA on next login
  - No data loss occurs — only new nullable/defaulted columns added
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'eula_accepted'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN eula_accepted boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'eula_accepted_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN eula_accepted_at timestamptz;
  END IF;
END $$;
