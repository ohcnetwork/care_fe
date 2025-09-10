import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

function FilterHeader({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-6 w-6 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default FilterHeader;
