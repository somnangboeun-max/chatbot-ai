-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES businesses(id),
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  customer_avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'bot_handled', 'needs_attention', 'owner_handled')),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES businesses(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'bot', 'owner')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
CREATE POLICY "Tenant isolation" ON conversations
  FOR ALL USING (tenant_id::text = auth.jwt()->>'tenant_id');

CREATE POLICY "Tenant isolation" ON messages
  FOR ALL USING (tenant_id::text = auth.jwt()->>'tenant_id');

-- Performance indexes
CREATE INDEX idx_messages_tenant_created ON messages(tenant_id, created_at);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_tenant_status ON conversations(tenant_id, status);

-- Enable Realtime publication for messages and conversations tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
