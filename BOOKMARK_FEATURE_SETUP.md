# Bookmark Feature Setup

This guide explains how to set up the new bookmark feature in Storia, which allows users to save their reading progress and continue from where they left off.

## Features

The bookmark feature provides:

1. Automatic saving of reading progress as users navigate through a book
2. Manual bookmark toggle with visual indication
3. "Last read" snippet showing where the user left off
4. Automatic resuming from the last read page when reopening a book

## Database Schema

The feature uses a new `user_bookmarks` table in Supabase with the following structure:

```sql
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
```

## Setup Instructions

### 1. Database Migration

Apply the migration to your Supabase instance:

1. Navigate to the Supabase dashboard for your project
2. Go to the SQL Editor section
3. Paste the contents of the `supabase/migrations/20240601_user_bookmarks.sql` file into the editor
4. Run the query to create the required tables and functions

Alternatively, if you're using the Supabase CLI:

```bash
supabase migration new user_bookmarks
# Copy the contents of supabase/migrations/20240601_user_bookmarks.sql to the new migration file
supabase db push
```

### 2. Implementation Details

The bookmark feature consists of:

1. **Database Table**: `user_bookmarks` to store reading progress
2. **API Functions**: Added to `src/lib/supabase.js` for managing bookmarks
3. **UI Integration**: Enhanced BookReader component with bookmark functionality

### 3. How It Works

- When a user opens a book, the application checks for an existing bookmark
- If a bookmark exists, the reader opens to that page automatically
- As the user reads, their progress is saved automatically
- Users can manually toggle bookmarks using the bookmark button
- The component displays a message when returning to a bookmarked page

## Testing

To test the bookmark feature:

1. Sign in to your account
2. Open a book and navigate to any page
3. Click the bookmark icon to manually save your progress
4. Close the book and navigate elsewhere
5. Return to the book - it should open at your bookmarked page
6. Continue reading and navigate to other pages - progress should be saved automatically

## Troubleshooting

If bookmarks are not working correctly:

1. Check that the database migration was applied successfully
2. Verify that the user is authenticated before attempting to use bookmarks
3. Check browser console for any errors related to bookmark operations
4. Ensure the book ID is being correctly passed to the bookmark functions 