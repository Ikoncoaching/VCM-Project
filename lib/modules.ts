export type ModuleKind = "watch" | "exercise";

export interface ModuleDef {
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  kind: ModuleKind;
  cardBlurb: string;
}

export const MODULES: ModuleDef[] = [
  {
    slug: "introduction",
    number: 1,
    title: "Introduction",
    subtitle: "Watch the films, then consider your history",
    kind: "watch",
    cardBlurb:
      "Three short films, then a journaling exercise to mine your history.",
  },
  {
    slug: "big-five",
    number: 2,
    title: "The Big Five",
    subtitle: "Get real data on your temperament",
    kind: "exercise",
    cardBlurb: "Take the assessment, upload your report.",
  },
  {
    slug: "enneagram",
    number: 3,
    title: "The Enneagram",
    subtitle: "Find the engine underneath",
    kind: "exercise",
    cardBlurb: "Take the RHETI, meet your type's core fear and desire.",
  },
  {
    slug: "words-i-like",
    number: 4,
    title: "Words I Like",
    subtitle: "Build your word constellation",
    kind: "exercise",
    cardBlurb: "Six steps from raw words to your story.",
  },
  {
    slug: "pick-your-tool",
    number: 5,
    title: "Pick Your Tool",
    subtitle: "Your VCM as a tool",
    kind: "exercise",
    cardBlurb: "Articulate the mechanism as a metaphor.",
  },
  {
    slug: "articulate",
    number: 6,
    title: "Articulate Your Value Creation Mechanism",
    subtitle: "Bring your ingredients together",
    kind: "exercise",
    cardBlurb: "The culminating statement of the journey.",
  },
];

/** The three videos inside the combined Introduction module. Their ids are
 *  the slugs of the pre-merge modules 1–3, so old progress maps onto them. */
export interface IntroVideo {
  id: string;
  title: string;
  videoSrc: string;
  framing: string;
}

export const INTRO_VIDEOS: IntroVideo[] = [
  {
    id: "introduction",
    title: "Introduction",
    videoSrc: "/videos/introduction.mp4",
    framing:
      "Start here. This video frames the whole project: how value creation has moved from the land, to the factory, to the self, and why articulating your Value Creation Mechanism is an unfair competitive advantage.",
  },
  {
    id: "fish-and-water",
    title: "Fish and Water",
    videoSrc: "/videos/fish-and-water.mp4",
    framing:
      "The first metaphor. Watch this before you do any of the exercises; it sets up how to see what has been in front of you the whole time.",
  },
  {
    id: "radio-to-tv",
    title: "Radio to TV",
    videoSrc: "/videos/radio-to-tv.mp4",
    framing:
      "The second metaphor. The story of you doesn't change; the resolution does. It explains why describing your VCM is an upgrade, not a final exam.",
  },
];

/**
 * Normalize a stored completion list to the current module set:
 * - radio-to-vr was renamed to radio-to-tv;
 * - modules 1–3 merged into one "introduction" module.
 *
 * "introduction" is kept when it provably covers all three videos: either
 * the legacy per-video completions are all present, or `watchedVideos`
 * (the merged module's confirmation checklist) covers them. A post-merge
 * completion always has all three confirmed, so it survives re-migration.
 */
export function migrateCompleted(
  slugs: string[],
  watchedVideos: string[] = []
): string[] {
  const renamed = slugs.map((s) => (s === "radio-to-vr" ? "radio-to-tv" : s));
  const covered = new Set([...watchedVideos, ...renamed]);
  const watchedAllThree =
    renamed.includes("introduction") &&
    INTRO_VIDEOS.every((v) => covered.has(v.id));
  // The three pre-merge watch modules fold into "introduction"; everything
  // else passes through. This used to keep only the seven VCM modules, which
  // silently dropped any tool with its own Completed box (Day in the Life)
  // on every reload (found 2026-09-11, TESTING.md flow 9).
  const legacyWatch = new Set(
    INTRO_VIDEOS.map((v) => v.id).filter((id) => id !== "introduction")
  );
  const kept = renamed.filter((s) => {
    if (s === "introduction") return watchedAllThree;
    return !legacyWatch.has(s);
  });
  return [...new Set(kept)];
}

/**
 * Videos inside the merged Introduction module that count as already watched
 * given a pre-migration completion list (each old watch module maps to one
 * video). Returns [] when there is nothing to seed.
 */
export function legacyWatchedVideos(slugs: string[]): string[] {
  const renamed = slugs.map((s) => (s === "radio-to-vr" ? "radio-to-tv" : s));
  return INTRO_VIDEOS.map((v) => v.id).filter((id) => renamed.includes(id));
}

export function moduleBySlug(slug: string): ModuleDef | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function nextModule(slug: string): ModuleDef | undefined {
  const m = moduleBySlug(slug);
  return m ? MODULES.find((x) => x.number === m.number + 1) : undefined;
}
