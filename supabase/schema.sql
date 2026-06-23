-- Rally League database schema
-- Run this in your Supabase SQL editor: https://supabase.com → your project → SQL Editor

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'competitor' CHECK (role IN ('competitor', 'organiser')),
  car_number TEXT,
  co_driver TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rallies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE,
  location TEXT NOT NULL,
  series TEXT,
  organiser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  stripe_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rally_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rally_id UUID REFERENCES rallies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('pre-event', 'route', 'bulletins', 'team', 'accommodation', 'results')),
  file_url TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'link', 'text')),
  link_url TEXT,
  content TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Storage ──────────────────────────────────────────────────────────────────

-- Run in Supabase dashboard: Storage → New bucket → Name: "rally-docs" → Public: ON

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rallies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rally_documents ENABLE ROW LEVEL SECURITY;

-- user_profiles: users can read/write their own profile
CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- rallies: anyone can read active rallies; organisers can manage their own
CREATE POLICY "Anyone reads active rallies" ON rallies FOR SELECT USING (status = 'active' OR organiser_id = auth.uid());
CREATE POLICY "Organisers insert rallies" ON rallies FOR INSERT WITH CHECK (auth.uid() = organiser_id);
CREATE POLICY "Organisers update own rallies" ON rallies FOR UPDATE USING (auth.uid() = organiser_id);

-- rally_documents: anyone can read; only the organiser of that rally can insert/delete
CREATE POLICY "Anyone reads documents" ON rally_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM rallies r WHERE r.id = rally_id AND r.status = 'active')
  OR EXISTS (SELECT 1 FROM rallies r WHERE r.id = rally_id AND r.organiser_id = auth.uid())
);
CREATE POLICY "Organisers post documents" ON rally_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM rallies r WHERE r.id = rally_id AND r.organiser_id = auth.uid())
);
CREATE POLICY "Organisers delete documents" ON rally_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM rallies r WHERE r.id = rally_id AND r.organiser_id = auth.uid())
);

-- ─── Realtime ─────────────────────────────────────────────────────────────────

-- Enable realtime for live bulletin updates
ALTER PUBLICATION supabase_realtime ADD TABLE rally_documents;
