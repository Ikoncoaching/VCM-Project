# Setting up the VCM Project

Three things need Kirk's accounts: a Supabase project, a Vercel project, and
the domain. Everything else is in the repo. About twenty minutes.

## 1. Supabase (the database and sign-in)

1. supabase.com, New project. Name it `vcm-project`, pick a US region, save
   the database password somewhere.
2. SQL Editor, New query. Paste all of
   `supabase/migrations/20261015000000_vcm_project.sql`, Run. Expect
   "Success. No rows returned." The warning about destructive operations is
   the `drop policy if exists` lines; they are safe.
3. Project Settings, API. Copy the Project URL and the `anon` key into
   `.env.local` (see `.env.local.example`).
4. Authentication, URL Configuration. Site URL `http://localhost:3100` for
   now; after deploy, `https://vcm.ikoncoaching.com`, and add it to the
   Redirect URLs.
5. Authentication, Providers, Email: leave signups enabled. Anyone with an
   email may start the project; that is the product.
6. Authentication, Emails, Magic Link: the subject and body. Supabase sends
   from its own address until SMTP is configured (Project Settings,
   Authentication, SMTP); the Gmail app password from Atlas works here too.
7. Sign in to the app once as kirk@ikoncoaching.com, then in the SQL Editor:
   `update public.profiles set is_admin = true where email = 'kirk@ikoncoaching.com';`
   That turns on the Participants page.

## 2. The videos

The ten module films are not in git (194 MB). They sit in `media/videos/`
on the machine that built this, and upload to the private `course-media`
bucket with the service role key (Project Settings, API, `service_role`):

```bash
SUPABASE_SERVICE_ROLE_KEY=... npm run upload-media
```

Paths in the bucket must match `media/` exactly; the script does that.

## 3. Vercel and the domain

1. Push the repo to GitHub, then Vercel, Add New Project, import it. Add
   the two `NEXT_PUBLIC_SUPABASE_*` variables. Deploy.
2. On the **Atlas** Vercel project, Settings, Domains: remove
   `vcm.ikoncoaching.com` (it is a redirect to atlas. there today).
3. On the new project, Settings, Domains: add `vcm.ikoncoaching.com`. DNS at
   Wix already points `vcm` at Vercel, so nothing changes there.
4. Back in Supabase (step 4 above) set the Site URL to the live address.
