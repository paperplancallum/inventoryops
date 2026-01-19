-- Update SellerBoard profile to exclude inventory losses
-- SellerBoard calculates damaged/lost/disposed internally, so we don't want to double-count

UPDATE cogs_settings
SET
  include_damaged_lost = false,
  include_disposed = false,
  description = 'Landed COGS for SellerBoard (excludes Amazon fees and inventory losses they track)'
WHERE name = 'sellerboard';
