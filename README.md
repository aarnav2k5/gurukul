# Tuition LMS

A private tuition resource library for chapter notes, previous-year questions, and sample papers with marking schemes.

## What is included

- Persistent local development server with file uploads
- Postgres schema for Supabase
- Teacher/student roles with Row Level Security
- Private Supabase Storage bucket for documents
- Docker deployment configuration
- Search, filters, downloads, marking-scheme downloads, and deletion

## Deploy with Supabase + Render/Railway

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor.
2. Enable Email auth in Supabase Authentication settings.
3. Create the first account, then promote it to teacher using the SQL comment at the bottom of the schema file.
4. Create a web service from this repository. The start command is `npm start`; Docker deployment is also supported.
5. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `PORT` as environment variables.
6. Set the Supabase Auth Site URL and redirect URLs to your production domain.
7. Add a custom domain and enable HTTPS at the host.

The browser uses Supabase automatically when `SUPABASE_URL` and `SUPABASE_ANON_KEY` are present. Without those variables it falls back to the local API and `data/` folder for development.

## Local development

```bash
npm start
```

Open http://localhost:4173.

For the guided provider setup, run `bash scripts/deploy-wizard.sh`. It pauses at every dashboard step and writes Supabase values into `.env`.

## Production checklist

- Use a real teacher account; never share the publishable key or service-role key in source control.
- Keep the `resources` bucket private and use signed URLs for downloads.
- Configure database backups, email confirmation, password reset, and rate limits.
- Add a privacy policy, terms, copyright/takedown process, and a way for students/guardians to contact the teacher.
- Do not upload copyrighted board/competitive papers unless you have permission to distribute them.
