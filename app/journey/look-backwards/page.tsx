import { redirect } from "next/navigation";

/** Consider Your History is now part of the merged Introduction module. */
export default function LookBackwardsPage() {
  redirect("/journey/introduction");
}
