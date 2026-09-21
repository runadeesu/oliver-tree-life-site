# Oliver Tree — Life Archive Community Edition

## Pages
- Home
- Timeline
- Music
- Videos
- Photos
- Fan Forum
- Source Library

## Languages
- Japanese
- English
- Spanish
- Russian

Language choice is stored in localStorage and shared across all pages.

## Supabase
Archive tables:
- ot_timeline
- ot_eras
- ot_photos
- ot_sources

Forum tables:
- ot_forum_posts
- ot_forum_comments

Forum access:
- No login/account required
- Name is optional; blank name becomes Anonymous
- Public read + public insert
- No public edit/delete, because there is no account identity to verify ownership
- `is_hidden` exists for moderation by trusted/admin tooling

## Vercel
Static deployment. No build command is required.
