-- =============================================================
-- SCRUM-60: Supabase Setup SQL
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================

-- Admin profiles table — extends Supabase auth.users
-- Links to the built-in auth system via user_id (UUID)
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user_id (used on every auth check)
CREATE INDEX idx_admin_profiles_user_id ON admin_profiles(user_id);

-- Row Level Security — only authenticated users can read their own profile
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: admins can only read their own profile
CREATE POLICY "Admins can view own profile"
    ON admin_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: only super_admins can insert new admin profiles
CREATE POLICY "Super admins can insert profiles"
    ON admin_profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Policy: only super_admins can update profiles
CREATE POLICY "Super admins can update profiles"
    ON admin_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_profiles_updated_at
    BEFORE UPDATE ON admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- MANUAL STEP: After creating your first user in Supabase Auth,
-- insert their admin profile:
--
-- INSERT INTO admin_profiles (user_id, email, full_name, role)
-- VALUES (
--     'paste-the-uuid-from-auth-users-here',
--     'admin@empiricalflooring.com.au',
--     'Admin Name',
--     'super_admin'
-- );
-- =============================================================
