import { LucideIcon } from "lucide-react";
import { ReactNode, useId } from "react";

import { Separator } from "@/components/ui/separator";
import { Muted, SubsectionTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface UserProfileSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function UserProfileSection({
  title,
  description,
  children,
  className,
  icon: Icon,
  action,
}: UserProfileSectionProps) {
  const id = useId();
  return (
    <section className={cn("min-w-0 space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <SubsectionTitle id={id}>{title}</SubsectionTitle>
          </div>
          {description && <Muted className="mt-1">{description}</Muted>}
        </div>
        {action}
      </div>
      <Separator />
      <div role="region" aria-labelledby={id}>
        {children}
      </div>
    </section>
  );
}
