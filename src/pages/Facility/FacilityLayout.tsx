import { FacilityCommandDialog } from "@/components/Facility/FacilityCommandDialog";
import { useFacilityShortcuts } from "@/hooks/useFacilityShortcuts";

interface FacilityLayoutProps {
  children: React.ReactNode;
}

export function FacilityLayout({ children }: FacilityLayoutProps) {
  const { commandDialogOpen, setCommandDialogOpen } = useFacilityShortcuts();

  return (
    <>
      {children}
      <FacilityCommandDialog
        open={commandDialogOpen}
        onOpenChange={setCommandDialogOpen}
      />
    </>
  );
}
