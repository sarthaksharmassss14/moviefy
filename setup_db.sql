-- ==========================================
-- MOVIEFY MASTER RESET & SETUP SCRIPT
-- ==========================================

-- 1. CLEANUP (Drop existing tables to start fresh)
DROP TABLE IF EXISTS watch_party_messages CASCADE;
DROP TABLE IF EXISTS watch_parties CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS watch_history CASCADE;
DROP TABLE IF EXISTS movie_lists CASCADE;

-- 2. TABLES SETUP
-- A. Watch Parties Table
CREATE TABLE watch_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    room_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 hours'),
    is_active BOOLEAN DEFAULT TRUE
);

-- B. Watch Party Messages (Chat)
CREATE TABLE watch_party_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES watch_parties(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    rating INTEGER,
    content TEXT,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- D. Watchlist Table
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- E. Watch History
CREATE TABLE watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    status TEXT DEFAULT 'watching', -- 'watching' or 'finished'
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- F. Movie Lists
CREATE TABLE movie_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    movies INTEGER[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SECURITY (RLS) SETUP
-- Enable RLS on all tables
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_party_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_lists ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
-- Watch Parties: Anyone can view, anyone can create (for now)
CREATE POLICY "Allow all to view parties" ON watch_parties FOR SELECT USING (true);
CREATE POLICY "Allow all to create parties" ON watch_parties FOR INSERT WITH CHECK (true);

-- Watch Party Messages: JWT SECURE POLICY (CLERK COMPATIBLE)
CREATE POLICY "Secure Chat Policy" ON watch_party_messages
  FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- General Policies for other tables (Allowing all for simplicity, can be tightened later)
CREATE POLICY "Allow all reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all watchlist" ON watchlist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all watch history" ON watch_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all movie lists" ON movie_lists FOR ALL USING (true) WITH CHECK (true);

-- 5. REALTIME SETUP
-- Add tables to the realtime publication
-- Note: We wrap in a block to handle if publication already exists or tables are already added
DO $$
BEGIN
  -- Recreate publication if needed or just add tables
  -- This ensures realtime is fresh for our new tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE watch_party_messages;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Table watch_party_messages might already be in publication';
  END;
END $$;
