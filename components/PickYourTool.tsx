"use client";

import RichTextArea from "./RichTextArea";

import { useEffect, useState } from "react";
import { moduleBySlug } from "@/lib/modules";
import { loadDraft, saveDraft } from "@/lib/storage";
import ModuleGate from "./ModuleGate";
import ModuleHeader from "./ModuleHeader";
import VideoSlot from "./VideoSlot";
import CompleteBar from "./CompleteBar";
import IngredientCapture from "./IngredientCapture";
import Skeleton from "@/components/Skeleton";

const DRAFT_KEY = "vcm-pick-your-tool";

interface ToolDraft {
  toolName: string;
  answers: Record<string, string>;
}

const PROMPTS = [
  {
    id: "work",
    q: "Explain why this tool describes you well.",
    hint: "What was it made for that you identify with?",
  },
];

export default function PickYourTool() {
  const m = moduleBySlug("pick-your-tool")!;
  const [draft, setDraft] = useState<ToolDraft | null>(null);

  useEffect(() => {
    setDraft(
      loadDraft<ToolDraft>(DRAFT_KEY) ?? {
        toolName: "",
        answers: {},
      }
    );
  }, []);

  useEffect(() => {
    if (draft) saveDraft(DRAFT_KEY, draft);
  }, [draft]);

  if (!draft) {
    return <div className="mx-auto max-w-3xl px-6 py-16"><Skeleton /></div>;
  }

  const canComplete =
    draft.toolName.trim().length > 0;

  return (
    <ModuleGate slug="pick-your-tool">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <ModuleHeader module={m} />
        <div className="mt-8">
          <VideoSlot
            title="Pick your tool"
            videoSrc="/videos/pick-your-tool.mp4"
          />
        </div>

        <p className="mt-6 text-lg leading-relaxed text-foreground/85">
          A mechanism is easiest to see as a tool. A lathe, a lighthouse, a
          tuning fork, a crowbar. Every tool is built for a kind of work and
          does it in a way nothing else quite does. Describe your VCM as a
          tool, in the metaphoric sense. Draw on your ingredients, your Big
          Five report, and your word constellation.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-navy/15 bg-paper p-6">
            <label className="font-display text-2xl text-navy">
              My Tool Is…
            </label>
            <input
              value={draft.toolName}
              onChange={(e) =>
                setDraft({ ...draft, toolName: e.target.value })
              }
              placeholder="a lighthouse · a whetstone · a swiss army knife · your own image"
              className="mt-3 w-full rounded-md border border-navy/25 px-4 py-3 font-display text-xl text-navy outline-none focus:border-navy"
            />
          </div>

          {PROMPTS.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-navy/15 bg-paper p-6"
            >
              <label className="font-medium text-navy">{p.q}</label>
              <p className="mt-1 text-sm text-navy/55">{p.hint}</p>
              <RichTextArea
                value={draft.answers[p.id] ?? ""}
                onChange={(html) =>
                  setDraft({
                    ...draft,
                    answers: { ...draft.answers, [p.id]: html },
                  })
                }
                placeholder=""
                label={p.q}
                minHeightClass="min-h-28"
              />
            </div>
          ))}
        </div>

        <IngredientCapture
          prompt="Sit with your tool for a moment and what the metaphor reveals. Write down a few words or phrases that capture what stood out and will help you return to these insights later. There is no right number, and you can always add more."
          source="pick-your-tool"
        />

        <CompleteBar
          slug="pick-your-tool"
          actionLabel="Complete this module"
          canComplete={canComplete}
          blockedHint="Name your tool and add at least 3 ingredients to finish."
        />
      </div>
    </ModuleGate>
  );
}
