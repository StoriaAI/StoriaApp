-- Add new columns to the user_bookmarks table for the bookmark feature
DO $$
BEGIN
    -- Check if selected_word column exists; if not, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_bookmarks' AND column_name = 'selected_word'
    ) THEN
        ALTER TABLE public.user_bookmarks 
        ADD COLUMN selected_word TEXT;
    END IF;
    
    -- Check if selection_context column exists; if not, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_bookmarks' AND column_name = 'selection_context'
    ) THEN
        ALTER TABLE public.user_bookmarks 
        ADD COLUMN selection_context TEXT;
    END IF;
    
    -- Remove unique constraint if it exists to allow multiple bookmarks per book
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'idx_user_book_bookmark'
    ) THEN
        ALTER TABLE public.user_bookmarks 
        DROP CONSTRAINT IF EXISTS idx_user_book_bookmark;
    END IF;
END
$$; 