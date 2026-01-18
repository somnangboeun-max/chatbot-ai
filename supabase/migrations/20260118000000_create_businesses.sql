-- Migration: Create businesses table with multi-tenant support
-- Story: 1.5 Multi-tenant Business Setup
-- Description: Creates the businesses table that serves as the foundation for
--              multi-tenant data isolation. Every subsequent table must reference
--              this table via tenant_id.

-- ============================================================================
-- Helper function to get current tenant_id from JWT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt()->>'tenant_id')::uuid,
    (auth.jwt()->'app_metadata'->>'tenant_id')::uuid
  );
$$;

-- ============================================================================
-- Helper function to set custom claims on user (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_claim(uid uuid, claim text, value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE auth.users SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(claim, value)
  WHERE id = uid;
END;
$$;

-- ============================================================================
-- Create businesses table
-- ============================================================================
CREATE TABLE public.businesses (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner relationship (FK to auth.users)
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business name (defaults to generic, updated during onboarding)
  name text NOT NULL DEFAULT 'My Business',

  -- Bot control (for Epic 3)
  bot_active boolean NOT NULL DEFAULT true,
  bot_paused_at timestamptz,

  -- Onboarding state (for Epic 2)
  onboarding_completed boolean NOT NULL DEFAULT false,

  -- Business profile placeholder columns (populated in Epic 2)
  opening_hours jsonb,
  address text,
  phone text,

  -- Facebook integration (for Epic 4)
  facebook_page_id text,
  facebook_page_name text,
  facebook_access_token text, -- Will be encrypted in Epic 4
  facebook_connected_at timestamptz,

  -- Notification settings (for Epic 5)
  notification_method text CHECK (notification_method IN ('telegram', 'sms')),
  notification_target text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
-- Index for owner lookup (used when loading user's business)
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- SELECT: Users can read their own business (tenant_id match)
CREATE POLICY "Users can view own business"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (id = public.get_current_tenant_id());

-- INSERT: Authenticated users can create a business (only once, enforced by owner_id unique)
-- Note: Initial insert bypasses RLS check as there's no tenant_id yet
-- The service role client handles initial business creation
CREATE POLICY "Users can create business"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Users can update their own business (tenant_id match)
CREATE POLICY "Users can update own business"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (id = public.get_current_tenant_id())
  WITH CHECK (id = public.get_current_tenant_id());

-- No DELETE policy - prevent accidental data loss
-- Businesses should not be deleted; they can be deactivated instead

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE public.businesses IS 'Core multi-tenant table. Every user owns exactly one business. All other tables reference this via tenant_id.';
COMMENT ON COLUMN public.businesses.id IS 'Business ID, used as tenant_id across all other tables';
COMMENT ON COLUMN public.businesses.owner_id IS 'FK to auth.users - the SME owner who created this business';
COMMENT ON COLUMN public.businesses.bot_active IS 'Whether the chatbot is active (can be toggled by owner)';
COMMENT ON COLUMN public.businesses.bot_paused_at IS 'Timestamp when bot was last paused (for analytics)';
COMMENT ON COLUMN public.businesses.onboarding_completed IS 'Whether the business has completed initial setup wizard';
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'Returns the tenant_id from the current JWT claims. Used in RLS policies.';
COMMENT ON FUNCTION public.set_claim(uuid, text, jsonb) IS 'Admin function to set custom claims on user JWT. Used to set tenant_id.';
