// Upload the protected course media to the private "course-media" bucket.
//
// Run once after supabase/course-media.sql, from the repo root:
//
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-media.mjs
//
// NEXT_PUBLIC_SUPABASE_URL is read from .env.local; the service key is not
// kept on disk here, so pass it on the command line (Supabase dashboard,
// Project Settings, API). Paths in the bucket match media/ exactly, which is
// what the rows in public.course_media name. Safe to re-run: existing objects
// are replaced.

import { createClient } from "@supabase/supabase-js";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("../media/", import.meta.url).pathname;
const env = Object.fromEntries(
  (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => l.split("=").map((s) => s.trim()))
);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL (.env.local) and SUPABASE_SERVICE_ROLE_KEY (env).");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const TYPES = { ".mp4": "video/mp4", ".pdf": "application/pdf" };

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let n = 0;
for await (const file of walk(root)) {
  const path = relative(root, file).split("\\").join("/");
  const ext = path.slice(path.lastIndexOf("."));
  const contentType = TYPES[ext];
  if (!contentType) continue;
  const body = await readFile(file);
  const { error } = await sb.storage
    .from("course-media")
    .upload(path, body, { contentType, upsert: true });
  if (error) {
    console.error("FAILED", path, error.message);
    process.exitCode = 1;
  } else {
    console.log("ok", path, `${(body.length / 1048576).toFixed(1)} MB`);
    n++;
  }
}
console.log(`${n} file(s) uploaded.`);
