-- ============================================
-- Our Love Universe - Full Schema v2
-- Drop everything and rebuild clean
-- ============================================

DROP TABLE IF EXISTS notifications       CASCADE;
DROP TABLE IF EXISTS user_challenges     CASCADE;
DROP TABLE IF EXISTS daily_challenges    CASCADE;
DROP TABLE IF EXISTS partner_invitations CASCADE;
DROP TABLE IF EXISTS promo_code_uses     CASCADE;
DROP TABLE IF EXISTS promo_codes         CASCADE;
DROP TABLE IF EXISTS user_subscriptions  CASCADE;
DROP TABLE IF EXISTS world_members       CASCADE;
DROP TABLE IF EXISTS occasions           CASCADE;
DROP TABLE IF EXISTS messages            CASCADE;
DROP TABLE IF EXISTS memories            CASCADE;
DROP TABLE IF EXISTS worlds              CASCADE;
DROP TABLE IF EXISTS profiles            CASCADE;

-- ============================================
-- Profiles (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  birthday      DATE,
  theme         TEXT        DEFAULT 'rose',
  dark_mode     BOOLEAN     DEFAULT FALSE,
  language      TEXT        DEFAULT 'ar',
  is_admin      BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Worlds
-- ============================================
CREATE TABLE worlds (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('personal','couple','family')),
  owner_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  cover_emoji TEXT        DEFAULT '🌍',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE world_members (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id   UUID        REFERENCES worlds(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT        NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','editor','viewer')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(world_id, user_id)
);

-- ============================================
-- Memories
-- ============================================
CREATE TABLE memories (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  world_id    UUID        REFERENCES worlds(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  location    TEXT,
  lat         DECIMAL(9,6),
  lng         DECIMAL(9,6),
  date        DATE        NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Messages
-- ============================================
CREATE TABLE messages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  world_id   UUID        REFERENCES worlds(id) ON DELETE SET NULL,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  mood       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Occasions
-- ============================================
CREATE TABLE occasions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  world_id     UUID        REFERENCES worlds(id) ON DELETE SET NULL,
  title        TEXT        NOT NULL,
  description  TEXT,
  date         DATE        NOT NULL,
  type         TEXT        NOT NULL DEFAULT 'special',
  notify_days  INT[]       DEFAULT '{1,3,7}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Subscription Plans
-- ============================================
CREATE TABLE user_subscriptions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan         TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free','couple','family')),
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  promo_code   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Promo Codes
-- ============================================
CREATE TABLE promo_codes (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT        NOT NULL UNIQUE,
  plan          TEXT        NOT NULL DEFAULT 'couple',
  free_days     INT         NOT NULL DEFAULT 30,
  max_uses      INT         DEFAULT NULL,
  current_uses  INT         DEFAULT 0,
  expires_at    TIMESTAMPTZ DEFAULT NULL,
  is_active     BOOLEAN     DEFAULT TRUE,
  created_by    UUID        REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promo_code_uses (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id    UUID        REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, user_id)
);

-- ============================================
-- Partner Invitations
-- ============================================
CREATE TABLE partner_invitations (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  world_id     UUID        REFERENCES worlds(id) ON DELETE CASCADE NOT NULL,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'editor',
  token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Daily Challenges
-- ============================================
CREATE TABLE daily_challenges (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  points      INT         DEFAULT 10,
  category    TEXT        DEFAULT 'romantic',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_challenges (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID        REFERENCES daily_challenges(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  points_earned INT        DEFAULT 10,
  UNIQUE(user_id, challenge_id)
);

-- ============================================
-- Notifications
-- ============================================
CREATE TABLE notifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT,
  type       TEXT        DEFAULT 'info',
  is_read    BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds             ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE occasions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);

-- Worlds
CREATE POLICY "worlds_owner" ON worlds FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "worlds_member_read" ON worlds FOR SELECT USING (
  auth.uid() = owner_id OR
  EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = id AND wm.user_id = auth.uid())
);

-- World Members
CREATE POLICY "world_members_policy" ON world_members FOR ALL USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM worlds w WHERE w.id = world_id AND w.owner_id = auth.uid())
);

-- Memories
CREATE POLICY "memories_policy" ON memories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories_world_read" ON memories FOR SELECT USING (
  auth.uid() = user_id OR
  (world_id IS NOT NULL AND EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = memories.world_id AND wm.user_id = auth.uid()))
);

-- Messages
CREATE POLICY "messages_policy" ON messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Occasions
CREATE POLICY "occasions_policy" ON occasions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "subscriptions_own" ON user_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Promo Codes (anyone can read active codes to verify)
CREATE POLICY "promo_codes_read" ON promo_codes FOR SELECT USING (is_active = true);
CREATE POLICY "promo_codes_admin" ON promo_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- Promo Code Uses
CREATE POLICY "promo_uses_own" ON promo_code_uses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Partner Invitations
CREATE POLICY "invitations_sender" ON partner_invitations FOR ALL USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "invitations_read_token" ON partner_invitations FOR SELECT USING (true);

-- Daily Challenges
CREATE POLICY "challenges_read" ON daily_challenges FOR SELECT USING (true);
CREATE POLICY "challenges_admin" ON daily_challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- User Challenges
CREATE POLICY "user_challenges_own" ON user_challenges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO user_subscriptions (user_id, plan) VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Seed: Daily Challenges
-- ============================================
INSERT INTO daily_challenges (title, description, points, category) VALUES
('رسالة صباحية', 'أرسل رسالة حب لشريكك في الصباح', 10, 'romantic'),
('صورة اليوم', 'التقطا صورة معاً اليوم', 15, 'memories'),
('وجبة مشتركة', 'تناولا وجبة معاً بدون هواتف', 20, 'quality-time'),
('اكتب 3 أشياء تحبها فيه/فيها', 'عبّر عن امتنانك بالكلمات', 10, 'appreciation'),
('رحلة مفاجئة', 'خذ شريكك لمكان جديد', 30, 'adventure'),
('فيلم رومانسي', 'شاهدا فيلماً رومانسياً معاً الليلة', 15, 'romantic'),
('مكالمة مفاجئة', 'اتصل/ي بشريكك فجأة لتقول له كم تحبه', 10, 'romantic'),
('هدية صغيرة', 'أحضر هدية صغيرة مفاجئة', 25, 'gifts'),
('رقصة في المنزل', 'ارقصا معاً على أغنية مفضلة', 20, 'fun'),
('اطبخا معاً', 'اطبخا وجبة جديدة معاً', 25, 'quality-time');

-- ============================================
-- Seed: Sample Promo Code
-- ============================================
INSERT INTO promo_codes (code, plan, free_days, max_uses, is_active)
VALUES ('LOVE2024', 'couple', 30, 100, true);
