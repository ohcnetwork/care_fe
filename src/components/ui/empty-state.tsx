import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Card } from "@/components/ui/card";

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon={icon} className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
    </Card>
  );
}
