/*
  # Update RLS Policies for Authenticated Users

  ## Overview
  This migration updates RLS policies to use authenticated users instead of public access.
  Users can only access their own data based on their user ID.

  ## Changes
  
  1. **user_profiles table**
     - Replace public policies with authenticated user policies
     - Users can view, insert, and update their own profile
  
  2. **businesses table**
     - Replace public policies with authenticated user policies
     - Users can view, insert, update, and delete their own businesses

  ## Security Notes
  - auth.uid() returns the authenticated user's ID
  - Policies ensure users can only access their own data
*/

-- Drop existing public policies for user_profiles
DROP POLICY IF EXISTS "Public can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can update profiles" ON user_profiles;

-- Create authenticated policies for user_profiles
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

-- Drop existing public policies for businesses
DROP POLICY IF EXISTS "Public can view businesses" ON businesses;
DROP POLICY IF EXISTS "Public can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Public can update businesses" ON businesses;
DROP POLICY IF EXISTS "Public can delete businesses" ON businesses;

-- Create authenticated policies for businesses
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