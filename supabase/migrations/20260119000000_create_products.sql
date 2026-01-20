-- Migration: Create products table
-- Story: 2.2 Products and Prices Onboarding Step
-- Description: Creates the products table for storing business products/services
--              with prices. Used by the chatbot to answer price questions.

-- ============================================================================
-- Create products table
-- ============================================================================
CREATE TABLE public.products (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant relationship (FK to businesses)
  tenant_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Product details
  name text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price > 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'KHR')),

  -- Status
  is_active boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
-- Index for tenant lookup (critical for RLS performance)
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);

-- Index for active products lookup
CREATE INDEX idx_products_tenant_active ON public.products(tenant_id, is_active);

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- SELECT: Users can view their own products
CREATE POLICY "Users can view own products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- INSERT: Users can add products to their own business
CREATE POLICY "Users can insert own products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- UPDATE: Users can update their own products
CREATE POLICY "Users can update own products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_current_tenant_id())
  WITH CHECK (tenant_id = public.get_current_tenant_id());

-- DELETE: Users can delete their own products
CREATE POLICY "Users can delete own products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE public.products IS 'Business products/services with prices. Used by bot for price responses.';
COMMENT ON COLUMN public.products.id IS 'Unique product identifier';
COMMENT ON COLUMN public.products.tenant_id IS 'FK to businesses - the business that owns this product';
COMMENT ON COLUMN public.products.name IS 'Product/service name (supports Khmer characters)';
COMMENT ON COLUMN public.products.price IS 'Product price (positive, max 2 decimal places)';
COMMENT ON COLUMN public.products.currency IS 'Currency code: USD or KHR (Cambodian Riel)';
COMMENT ON COLUMN public.products.is_active IS 'Whether product is active and shown to customers';
