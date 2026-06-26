-- Fix: shared-world members couldn't see occasions/messages created by their partner.
-- memories already had a world_read policy; this adds the same for messages & occasions.

DROP POLICY IF EXISTS "messages_world_read" ON messages;
CREATE POLICY "messages_world_read" ON messages FOR SELECT USING (
  auth.uid() = user_id OR
  (world_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM world_members wm
    WHERE wm.world_id = messages.world_id AND wm.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "occasions_world_read" ON occasions;
CREATE POLICY "occasions_world_read" ON occasions FOR SELECT USING (
  auth.uid() = user_id OR
  (world_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM world_members wm
    WHERE wm.world_id = occasions.world_id AND wm.user_id = auth.uid()
  ))
);
