-- Story 4.2: Messenger Webhook Receiver
-- Add columns needed for webhook processing to existing tables

-- Add facebook_sender_id alias column to conversations
-- This maps to customer_id but with clearer naming for Messenger context
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS facebook_sender_id TEXT;

-- Populate facebook_sender_id from customer_id for existing records
UPDATE conversations SET facebook_sender_id = customer_id WHERE facebook_sender_id IS NULL;

-- Create unique index for webhook lookups (tenant + sender combination)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_tenant_facebook_sender
ON conversations(tenant_id, facebook_sender_id)
WHERE facebook_sender_id IS NOT NULL;

-- Add missing columns to messages table for webhook data
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS facebook_message_id TEXT,
ADD COLUMN IF NOT EXISTS is_handover_trigger BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS handover_reason TEXT;

-- Add check constraint for handover_reason values
ALTER TABLE messages
ADD CONSTRAINT messages_handover_reason_check
CHECK (
  handover_reason IS NULL OR
  handover_reason IN ('low_confidence', 'frustration', 'human_requested', 'complex_question')
);

-- Add service role policies for webhook processing
-- These allow the service role to bypass RLS for webhook handlers

-- Conversations: Allow service role full access
CREATE POLICY "Service role full access conversations"
ON conversations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Messages: Allow service role full access
CREATE POLICY "Service role full access messages"
ON messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add index on facebook_message_id for deduplication checks
CREATE INDEX IF NOT EXISTS idx_messages_facebook_message_id
ON messages(facebook_message_id)
WHERE facebook_message_id IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN conversations.facebook_sender_id IS 'Facebook user PSID (Page-Scoped ID) for Messenger conversations';
COMMENT ON COLUMN messages.facebook_message_id IS 'Original Facebook message ID for deduplication';
COMMENT ON COLUMN messages.is_handover_trigger IS 'Whether this message triggered a handover to human';
COMMENT ON COLUMN messages.handover_reason IS 'Reason for handover: low_confidence, frustration, human_requested, complex_question';
