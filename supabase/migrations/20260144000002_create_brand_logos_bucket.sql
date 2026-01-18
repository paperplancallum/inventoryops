-- Migration: Create brand-logos storage bucket
-- Part of Settings section implementation

-- Create the storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-logos',
  'brand-logos',
  true,  -- Public bucket for easy logo display
  5242880,  -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for brand-logos bucket

-- Anyone can view brand logos (public bucket)
CREATE POLICY "Public can view brand logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-logos');

-- Authenticated users can upload brand logos
CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-logos');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update brand logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-logos')
WITH CHECK (bucket_id = 'brand-logos');

-- Authenticated users can delete brand logos
CREATE POLICY "Authenticated users can delete brand logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-logos');
