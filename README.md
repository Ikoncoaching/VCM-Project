# The VCM Project by Ikon Coaching

A standalone site for the Value Creation Mechanism Project: Kirk Wayman's
six-module journey (plus the Consider Your History journaling step) that
helps a person discover and articulate the distinctive way they create
value. Anyone with an email can sign in and work through it; Kirk reads
participants' work on the Participants page.

Split out of Atlas (github.com/Ikoncoaching/vcm) on 2026-10-15. The module
components, the rich text editor, the progress and save layers, and the
video slot are Atlas's, copied as they stood that day; the shell, sign-in,
welcome page and coach view are this site's own. The two are maintained
separately from here on.

- Setup, in Kirk's accounts: `SETUP.md`
- Running locally: `npm install`, then `npm run dev` (port 3100). Without
  Supabase keys the app runs against the browser only.
- Checks: `npx tsc --noEmit` and `npm run lint`.

Links back to ikoncoaching.com sit in the header, the welcome page and the
footer. No em dashes anywhere, headings in Title Case, same as Atlas.
