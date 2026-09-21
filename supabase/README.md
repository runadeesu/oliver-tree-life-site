# Supabase setup

The live Oliver Tree archive already uses the configured Supabase project.

## Forum tables
- `ot_forum_posts`
- `ot_forum_comments`

The forum is intentionally account-free:
- anyone can read visible posts/comments
- anyone can create a post or reply using a name or anonymously
- public update/delete is disabled because there is no identity to verify ownership
- moderation can hide content with `is_hidden`

For a fresh project, apply `migrations/0001_anonymous_forum.sql` and update `assets/config.js` with the project URL and publishable key.
