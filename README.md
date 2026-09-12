# gurukul

A learning resource library for chapter notes, previous-year questions, and sample papers with marking schemes.

## What is included

- Supabase-backed authentication, database records, and cloud file uploads
- Postgres schema for Supabase
- Teacher/student roles with Row Level Security
- Public student downloads from Supabase Storage
- Next.js, React, TypeScript, Tailwind CSS, and Lucide-based frontend
- Docker deployment configuration
- Search, filters, downloads, marking-scheme downloads, and deletion

## Deploy with Supabase + Vercel

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor.
2. If the project already existed, run [`supabase/resource-management-migration.sql`](./supabase/resource-management-migration.sql) once to enable editing, restore, duplicate detection, and file sizes.
3. Run [`supabase/realtime-audience.sql`](./supabase/realtime-audience.sql) once to allow authenticated teachers to see teacher presence names.
4. Run [`supabase/single-teacher-session.sql`](./supabase/single-teacher-session.sql) once to allow only the newest teacher tab/device to remain active.
5. Enable Email auth in Supabase Authentication settings.
6. Create the first account, then promote it to teacher using the SQL comment at the bottom of the schema file.
7. Import the repository into Vercel with the Next.js preset and `npm run build`.
8. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as Vercel environment variables for Production, Preview, and Development.
9. Set the Supabase Auth Site URL and redirect URLs to your Vercel production domain.
10. Add a custom domain and enable HTTPS at Vercel if required.

The browser requires Supabase configuration and does not use local file storage. Supabase is the only source of truth for users, resources, and uploaded files.

## Local development

```bash
npm run dev
```

Open http://localhost:5173. To test the production server locally, run `npm run build && npm start` and open http://localhost:4173.

For the guided provider setup, run `bash scripts/deploy-wizard.sh`. It pauses at every dashboard step and writes Supabase values into `.env`.

The frontend is powered by Next.js and is optimized for Vercel deployment.

## Production checklist

- Use a real teacher account; never share the publishable key or service-role key in source control.
- The `resources` bucket is public by design so anonymous students can download files; do not upload confidential material.
- Configure database backups, email confirmation, password reset, and rate limits.
- Add a privacy policy, terms, copyright/takedown process, and a way for students/guardians to contact the teacher.
- Do not upload copyrighted board/competitive papers unless you have permission to distribute them.
