# Bookmark Feature Setup

This guide explains how to set up the new bookmark feature in Storia, which allows users to save their reading progress and select specific text to bookmark.

## Features

The bookmark feature provides:

1. Automatic saving of reading progress as users navigate through a book
2. Manual bookmark toggle with visual indication
3. Text selection bookmarking - select any word or phrase in the text to bookmark it
4. Timestamp tracking for all bookmarks
5. Bookmark management interface in the user's profile
6. Ability to store multiple bookmarks per book

## Database Schema

The feature uses a `user_bookmarks` table in Supabase with the following structure:

```sql
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    last_paragraph TEXT,
    selected_word TEXT,
    selection_context TEXT,
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
3. Paste the contents of the following files:
   - `supabase/migrations/20240601_user_bookmarks.sql` - Initial table creation
   - `supabase/migrations/20240615_update_bookmarks.sql` - Adds text selection fields
4. Run the queries to create and update the required tables and functions

Alternatively, if you're using the Supabase CLI:

```bash
supabase migration new user_bookmarks
# Copy the contents of migration files to the new migration files
supabase db push
```

### 2. Implementation Details

The bookmark feature consists of:

1. **Database Table**: `user_bookmarks` to store reading progress and selected text
2. **API Functions**: Added to `src/lib/supabase.js` for managing bookmarks
3. **UI Integration**: 
   - Enhanced BookReader component with bookmark functionality
   - Selection menu for text selection
   - Bookmark list component for the user profile

### 3. How It Works

#### Page Bookmarks
- Users can bookmark entire pages by clicking the bookmark icon in the toolbar
- When a user opens a book, the application checks for existing bookmarks
- As the user reads, their progress is saved automatically

#### Text Selection Bookmarks
- Users can select any text in the book by highlighting it
- A popup menu appears offering the option to bookmark the selected text
- The selected text, along with its context and page number, is saved to the database

#### Bookmark Management
- In the user profile, under the "Bookmarks" tab, users can see all their bookmarks
- Bookmarks are grouped by book and show the selected text and a timestamp
- Users can navigate directly to a bookmark or delete it

## Testing

To test the bookmark feature:

1. Sign in to your account
2. Open a book and navigate to any page
3. Click the bookmark icon to manually save your progress
4. Select some text and use the popup menu to create a text selection bookmark
5. Go to your profile and check the "Bookmarks" tab to see your saved bookmarks
6. Click on a bookmark to navigate directly to that page and text

## Troubleshooting

If bookmarks are not working correctly:

1. Check that the database migrations were applied successfully
2. Verify that the user is authenticated before attempting to use bookmarks
3. Check browser console for any errors related to bookmark operations
4. Ensure text selection is working properly by testing on different browsers 