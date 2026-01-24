-- Migration: Add attention-related columns to conversations table
-- Story 3.4: Attention Items List

-- Add handover_reason column (nullable - null means no handover)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handover_reason TEXT
  CONSTRAINT chk_handover_reason CHECK (handover_reason IN ('low_confidence', 'customer_frustrated', 'human_requested', 'complex_question'));

-- Add last_message_preview for efficient rendering
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Add viewed_at for tracking when owner viewed the conversation
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Partial index for efficient attention queries
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_attention
  ON conversations(tenant_id, last_message_at DESC)
  WHERE status = 'needs_attention';

-- Enable REPLICA IDENTITY FULL so Realtime payload.old contains all columns
-- Required for detecting status transitions (e.g., needs_attention → active)
ALTER TABLE conversations REPLICA IDENTITY FULL;
