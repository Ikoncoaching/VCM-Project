import { redirect } from "next/navigation";

// Modules 1–3 merged into the Introduction module; keep the old URL working.
export default function FishAndWaterPage() {
  redirect("/journey/introduction");
}
