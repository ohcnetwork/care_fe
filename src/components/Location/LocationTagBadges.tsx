import { cn } from "@/lib/utils";

import TagBadge from "@/components/Tags/TagBadge";

import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

interface LocationTagBadgesProps {
  tags?: TagConfig[];
  className?: string;
  badgeClassName?: string;
}

export function LocationTagBadges({
  tags,
  className,
  badgeClassName = "text-xs",
}: LocationTagBadgesProps) {
  if (!tags?.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} className={badgeClassName} />
      ))}
    </div>
  );
}
