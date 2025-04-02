-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Users can view only their own profile
CREATE POLICY user_profiles_select_policy ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can insert only their own profile
CREATE POLICY user_profiles_insert_policy ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update only their own profile
CREATE POLICY user_profiles_update_policy ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for profile photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage permissions
CREATE POLICY storage_profile_photos_select_policy ON storage.objects
  FOR SELECT USING (bucket_id = 'profile_photos');

CREATE POLICY storage_profile_photos_insert_policy ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile_photos' AND 
    auth.uid() = owner
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a profile record when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 