-- Add Facebook connection fields to businesses table
-- Story 4.1: Facebook Page Connection Flow

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS facebook_page_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_page_name TEXT,
ADD COLUMN IF NOT EXISTS facebook_page_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_access_token TEXT,
ADD COLUMN IF NOT EXISTS facebook_connected_at TIMESTAMPTZ;

-- Create partial index on facebook_page_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_businesses_facebook_page_id
ON businesses(facebook_page_id)
WHERE facebook_page_id IS NOT NULL;

COMMENT ON COLUMN businesses.facebook_access_token IS 'AES-256-GCM encrypted Page access token';
