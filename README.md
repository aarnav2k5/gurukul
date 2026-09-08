# Gurukul

A learning resource library for chapter notes, previous-year questions, and sample papers with marking schemes.

## What is included

- Supabase-backed authentication, database records, and cloud file uploads
- Postgres schema for Supabase
- Teacher/student roles with Row Level Security
- Public student downloads from Supabase Storage
- React, Vite, Tailwind CSS, and Lucide-based frontend
- Docker deployment configuration
- Search, filters, downloads, marking-scheme downloads, and deletion

## Deploy with Supabase + Render/Railway

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor.
2. If the project already existed, run [`supabase/resource-management-migration.sql`](./supabase/resource-management-migration.sql) once to enable editing, restore, duplicate detection, and file sizes.
3. Run [`supabase/realtime-audience.sql`](./supabase/realtime-audience.sql) once to allow authenticated teachers to see teacher presence names.
4. Enable Email auth in Supabase Authentication settings.
5. Create the first account, then promote it to teacher using the SQL comment at the bottom of the schema file.
6. Create a web service from this repository. Set the build command to `npm run build` and the start command to `npm start`; Docker deployment is also supported.
7. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `PORT` as environment variables.
8. Set the Supabase Auth Site URL and redirect URLs to your production domain.
9. Add a custom domain and enable HTTPS at the host.

The browser requires Supabase configuration and does not use local file storage. Supabase is the only source of truth for users, resources, and uploaded files.

## Local development

```bash
npm run dev
```

Open http://localhost:5173. To test the production server locally, run `npm run build && npm start` and open http://localhost:4173.

For the guided provider setup, run `bash scripts/deploy-wizard.sh`. It pauses at every dashboard step and writes Supabase values into `.env`.

The frontend is powered by Next.js. Render should use `npm run build` as the build command and `npm start` as the start command. Next.js listens on Render's `PORT` automatically.

## Production checklist

- Use a real teacher account; never share the publishable key or service-role key in source control.
- The `resources` bucket is public by design so anonymous students can download files; do not upload confidential material.
- Configure database backups, email confirmation, password reset, and rate limits.
- Add a privacy policy, terms, copyright/takedown process, and a way for students/guardians to contact the teacher.
- Do not upload copyrighted board/competitive papers unless you have permission to distribute them.
