-- Add Paper Plan brand
INSERT INTO brands (name, description, status)
VALUES ('Paper Plan', 'Paper Plan brand', 'active')
ON CONFLICT (name) DO NOTHING;
