-- Extension pgvector pour la recherche sémantique
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    wallet_address TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_tier TEXT DEFAULT 'free',
    subscription_expires TIMESTAMPTZ
);

-- Compagnons
CREATE TABLE IF NOT EXISTS companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    element INTEGER NOT NULL CHECK (element BETWEEN 0 AND 6),
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    intelligence INTEGER DEFAULT 10,
    emotion INTEGER DEFAULT 10,
    agility INTEGER DEFAULT 10,
    bond INTEGER DEFAULT 0,
    form INTEGER DEFAULT 0,
    current_mood TEXT DEFAULT 'neutral',
    nft_token_id TEXT UNIQUE,
    nft_chain TEXT,
    is_soulbound BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_interaction TIMESTAMPTZ
);

-- Historique des conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID REFERENCES companions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'companion')),
    content TEXT NOT NULL,
    xp_gained INTEGER DEFAULT 0,
    emotional_tag TEXT,
    importance_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Souvenirs MemoClaw
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID REFERENCES companions(id) ON DELETE CASCADE,
    namespace TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384),
    importance FLOAT DEFAULT 0.5,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index vectoriel pour recherche sémantique
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Transactions NFT
CREATE TABLE IF NOT EXISTS nft_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID REFERENCES companions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    from_address TEXT,
    to_address TEXT,
    transaction_hash TEXT,
    price_eth DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS — chaque user voit uniquement ses données
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own companions" ON companions
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON messages
    FOR ALL USING (
        companion_id IN (
            SELECT id FROM companions WHERE user_id = auth.uid()
        )
    );
