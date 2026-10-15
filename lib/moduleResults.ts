"use client";

import { loadDraft } from "./storage";
import { BIG_FIVE, ordinal, type Scores } from "./bigfive";

/**
 * The concrete results a client produced in the assessment modules: their Big
 * Five percentiles, their Enneagram type, the shape their words made, and the
 * tool they chose.
 *
 * These sit alongside the ingredients a client typed by hand, so that
 * everything they discovered is in front of them while they write their VCM.
 * They are derived from each module's saved draft on every read rather than
 * copied into the ingredient list, so they always reflect the client's current
 * answers: change your Enneagram type or your tool and this follows, with no
 * stale duplicate left behind.
 */
export interface ModuleResult {
  /** what to show on the chip */
  label: string;
  /** which module it came from, for grouping */
  group: string;
}

interface BigFiveDraftShape {
  scores?: Scores;
}
interface ToolDraftShape {
  toolName?: string;
}

export function getModuleResults(): ModuleResult[] {
  const out: ModuleResult[] = [];

  // Big Five: the five factors, each with its percentile
  const bf = loadDraft<BigFiveDraftShape>("vcm-big-five");
  if (bf?.scores) {
    for (const { trait } of BIG_FIVE) {
      const v = bf.scores[trait];
      if (typeof v === "number") {
        out.push({
          label: `${trait}: ${ordinal(v)} percentile`,
          group: "Big Five",
        });
      }
    }
  }

  // The Enneagram type and the Words I Like constellation are rendered in full
  // by ModuleResultCards (the type's own profile language, and the shape drawn
  // with the client's words on it), so they are deliberately not chips here.

  // Pick Your Tool: the tool they chose
  const tool = loadDraft<ToolDraftShape>("vcm-pick-your-tool");
  if (tool?.toolName?.trim()) {
    out.push({
      label: `Your tool: ${tool.toolName.trim()}`,
      group: "Your Tool",
    });
  }

  return out;
}

/** the results grouped in the order the modules are worked */
export function groupModuleResults(
  results: ModuleResult[]
): { group: string; items: string[] }[] {
  const order = ["Big Five", "Your Tool"];
  return order
    .map((group) => ({
      group,
      items: results.filter((r) => r.group === group).map((r) => r.label),
    }))
    .filter((g) => g.items.length > 0);
}
