import SaveStatus from "@/components/SaveStatus";

/** the modules, with the floating save receipt over the corner of the page */
export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SaveStatus />
    </>
  );
}
