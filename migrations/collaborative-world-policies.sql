-- ============================================================
-- Collaborative shared-world RLS for memories / messages / occasions
-- ------------------------------------------------------------
-- Problem this fixes:
--   * The old policies only checked world_members, so the WORLD OWNER
--     (tracked in worlds.owner_id, NOT in world_members) could neither
--     see nor edit their partner's content.
--   * Editing a partner's row failed with:
--     "new row violates row-level security policy".
--
-- New model: anyone who PARTICIPATES in a world (its owner OR a member)
-- can read / update / delete that world's content. Each user can only
-- INSERT rows under their own user_id.
-- ============================================================

-- Helper predicate is inlined per table because Postgres RLS can't take params.

-- ---------- MEMORIES ----------
DROP POLICY IF EXISTS "memories_policy"      ON memories;
DROP POLICY IF EXISTS "memories_world_read"  ON memories;
DROP POLICY IF EXISTS "memories_select"      ON memories;
DROP POLICY IF EXISTS "memories_insert"      ON memories;
DROP POLICY IF EXISTS "memories_update"      ON memories;
DROP POLICY IF EXISTS "memories_delete"      ON memories;

CREATE POLICY "memories_select" ON memories FOR SELECT USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = memories.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = memories.world_id AND wm.user_id  = auth.uid())
  ))
);
CREATE POLICY "memories_insert" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories_update" ON memories FOR UPDATE USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = memories.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = memories.world_id AND wm.user_id  = auth.uid())
  ))
) WITH CHECK (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = memories.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = memories.world_id AND wm.user_id  = auth.uid())
  ))
);
CREATE POLICY "memories_delete" ON memories FOR DELETE USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = memories.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = memories.world_id AND wm.user_id  = auth.uid())
  ))
);

-- ---------- MESSAGES ----------
DROP POLICY IF EXISTS "messages_policy"      ON messages;
DROP POLICY IF EXISTS "messages_world_read"  ON messages;
DROP POLICY IF EXISTS "messages_select"      ON messages;
DROP POLICY IF EXISTS "messages_insert"      ON messages;
DROP POLICY IF EXISTS "messages_update"      ON messages;
DROP POLICY IF EXISTS "messages_delete"      ON messages;

CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = messages.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = messages.world_id AND wm.user_id  = auth.uid())
  ))
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = messages.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = messages.world_id AND wm.user_id  = auth.uid())
  ))
) WITH CHECK (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = messages.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = messages.world_id AND wm.user_id  = auth.uid())
  ))
);
CREATE POLICY "messages_delete" ON messages FOR DELETE USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = messages.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = messages.world_id AND wm.user_id  = auth.uid())
  ))
);

-- ---------- OCCASIONS ----------
DROP POLICY IF EXISTS "occasions_policy"      ON occasions;
DROP POLICY IF EXISTS "occasions_world_read"  ON occasions;
DROP POLICY IF EXISTS "occasions_select"      ON occasions;
DROP POLICY IF EXISTS "occasions_insert"      ON occasions;
DROP POLICY IF EXISTS "occasions_update"      ON occasions;
DROP POLICY IF EXISTS "occasions_delete"      ON occasions;

CREATE POLICY "occasions_select" ON occasions FOR SELECT USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = occasions.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = occasions.world_id AND wm.user_id  = auth.uid())
  ))
);
CREATE POLICY "occasions_insert" ON occasions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "occasions_update" ON occasions FOR UPDATE USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = occasions.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = occasions.world_id AND wm.user_id  = auth.uid())
  ))
) WITH CHECK (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = occasions.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = occasions.world_id AND wm.user_id  = auth.uid())
  ))
);
CREATE POLICY "occasions_delete" ON occasions FOR DELETE USING (
  auth.uid() = user_id OR (world_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM worlds w        WHERE w.id        = occasions.world_id AND w.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = occasions.world_id AND wm.user_id  = auth.uid())
  ))
);
