-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    country TEXT,
    profile_photo_url TEXT,
    preferred_genres TEXT[] DEFAULT '{}',
    ai_preferences TEXT[] DEFAULT '{}',
    has_completed_onboarding BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up storage for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Set up RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view only their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update only their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert only their own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Storage policies
CREATE POLICY IF NOT EXISTS "Anyone can read profile photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile_photos');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload profile photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile_photos' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY IF NOT EXISTS "Users can update their own photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile_photos' 
        AND auth.uid() = owner
    );

-- Function to create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) 
    DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle profile updates
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamp when profile is updated
DROP TRIGGER IF EXISTS on_profile_update ON public.user_profiles;
CREATE TRIGGER on_profile_update
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();
    
-- Create bookmarks table for tracking reading progress
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    last_paragraph TEXT,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a unique constraint to ensure one bookmark per user per book
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_book_bookmark 
ON public.user_bookmarks(user_id, book_id);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id 
ON public.user_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id 
ON public.user_bookmarks(book_id);

-- Set up RLS (Row Level Security)
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view only their own bookmarks"
    ON public.user_bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update only their own bookmarks"
    ON public.user_bookmarks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert only their own bookmarks"
    ON public.user_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete only their own bookmarks"
    ON public.user_bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- Function to handle bookmark updates
CREATE OR REPLACE FUNCTION public.handle_bookmark_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.last_read_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps when bookmark is updated
DROP TRIGGER IF EXISTS on_bookmark_update ON public.user_bookmarks;
CREATE TRIGGER on_bookmark_update
    BEFORE UPDATE ON public.user_bookmarks
    FOR EACH ROW EXECUTE FUNCTION public.handle_bookmark_update(); 