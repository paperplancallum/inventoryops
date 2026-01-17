-- Make payment-attachments bucket public so files can be accessed via public URL
UPDATE storage.buckets
SET public = true
WHERE id = 'payment-attachments';
