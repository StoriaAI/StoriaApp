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