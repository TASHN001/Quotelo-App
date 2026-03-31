/*
  # Allow Public Access for Onboarding

  ## Overview
  This migration updates RLS policies to allow public (anonymous) access for onboarding flows.
  Since the app currently uses local UUIDs without authentication, we need to allow
  public access to user_profiles and businesses tables.

  ## Changes
  
  1. **user_profiles table**
     - Add public policies for SELECT, INSERT, UPDATE operations
     - Allow anyone to create and manage profiles during onboarding
  
  2. **businesses table**
     - Add public policies for SELECT, INSERT, UPDATE, DELETE operations
     - Allow anyone to create and manage businesses during onboarding

  ## Security Notes
  - These policies are suitable for development and onboarding
  - In production with authentication, more restrictive policies should be used
  - Consider implementing authentication and updating policies accordingly
*/

-- Drop existing restrictive policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create public policies for user_profiles (for onboarding without auth)
CREATE POLICY "Public can view profiles"
  ON user_profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert profiles"
  ON user_profiles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update profiles"
  ON user_profiles FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Drop existing restrictive policies for businesses
DROP POLICY IF EXISTS "Users can view own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON businesses;

-- Create public policies for businesses (for onboarding without auth)
CREATE POLICY "Public can view businesses"
  ON businesses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert businesses"
  ON businesses FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update businesses"
  ON businesses FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete businesses"
  ON businesses FOR DELETE
  TO public
  USING (true);