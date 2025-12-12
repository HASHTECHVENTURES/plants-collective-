# Database Setup Instructions for Plants Collective AI

## Issue
The `conversations` and `messages` tables are missing from your Supabase database, causing errors when trying to use the Plants Collective AI feature.

## Solution
You need to create these tables in your Supabase database.

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `vwdrevguebayhyjfurag`

### Step 2: Open SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Click "New query"

### Step 3: Run the SQL Script
1. Open the file `CONVERSATIONS_SETUP.sql` in this project
2. Copy ALL the contents of that file
3. Paste it into the Supabase SQL Editor
4. Click "Run" or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

### Step 4: Verify Tables Created
After running the SQL, verify the tables exist:
1. Go to "Table Editor" in the left sidebar
2. You should see two new tables:
   - `conversations`
   - `messages`

### Alternative: Quick Setup via Supabase Dashboard

If you prefer using the UI:

#### Create `conversations` table:
1. Go to Table Editor → New Table
2. Name: `conversations`
3. Add columns:
   - `id` (uuid, primary key, default: `uuid_generate_v4()`)
   - `user_id` (uuid, not null)
   - `title` (text, not null, default: 'New Conversation')
   - `created_at` (timestamptz, default: now())
   - `updated_at` (timestamptz, default: now())
   - `is_archived` (boolean, default: false)

#### Create `messages` table:
1. Go to Table Editor → New Table
2. Name: `messages`
3. Add columns:
   - `id` (uuid, primary key, default: `uuid_generate_v4()`)
   - `conversation_id` (uuid, foreign key → conversations.id, cascade delete)
   - `user_id` (uuid, not null)
   - `content` (text, not null)
   - `is_user_message` (boolean, not null, default: true)
   - `created_at` (timestamptz, default: now())
   - `metadata` (jsonb, default: '{}')

#### Enable RLS (Row Level Security):
1. For each table, go to Settings
2. Enable "Enable Row Level Security (RLS)"
3. Add policies:
   - Allow all operations for anon and authenticated roles

### Troubleshooting

**Error: "Could not find the table 'public.conversations'"**
- Make sure you've run the SQL script successfully
- Refresh your browser
- Check that tables appear in Table Editor

**Error: "Permission denied"**
- Make sure RLS policies are set up correctly
- Verify grants are given to `anon` and `authenticated` roles

**Still getting errors?**
- Clear browser cache
- Restart the development server
- Check Supabase dashboard for any additional errors

## After Setup

Once the tables are created, the Plants Collective AI feature should work properly. You'll be able to:
- Create new conversations
- Send and receive messages
- View chat history
- Archive conversations


