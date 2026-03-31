/*
  # Create Storage Bucket and Secure Policies for Business Assets

  1. Storage Setup
    - Creates `business-assets` bucket if it doesn't exist
    - Sets bucket to public for easy access to uploaded logos
    - Configures allowed file types (images only)
    - Sets file size limit to 5MB

  2. Security (RLS Policies)
    - Authenticated users can SELECT (view) all files in the bucket
    - Authenticated users can INSERT files only in their own folder (user_id path)
    - Authenticated users can UPDATE files only in their own folder
    - Authenticated users can DELETE files only in their own folder
    - Public access is restricted to SELECT only (for displaying logos on invoices)

  3. Important Notes
    - Logo files are stored in path: `{user_id}/logo-{timestamp}.{ext}`
    - Only image files are allowed: JPEG, PNG, GIF, WebP
    - Maximum file size: 5MB
    - Bucket is public to allow logo display without authentication
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give users access to business-assets" ON storage.objects;
DROP POLICY IF EXISTS "Give users insert to business-assets" ON storage.objects;
DROP POLICY IF EXISTS "Give users update to business-assets" ON storage.objects;
DROP POLICY IF EXISTS "Give users delete to business-assets" ON storage.objects;

-- Allow public to view all files in business-assets (needed for logo display on invoices)
CREATE POLICY "Anyone can view business assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'business-assets');

-- Allow authenticated users to insert files in their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-assets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update files in their own folder
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-assets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-assets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
