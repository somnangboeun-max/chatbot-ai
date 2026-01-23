-- Migration: Add businesses table to Supabase Realtime publication
-- Story: 3.3 Bot Status Toggle (Pause/Resume)
-- Description: Enables real-time updates for the businesses table so that
--              bot_active status changes propagate to all connected clients.

ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
