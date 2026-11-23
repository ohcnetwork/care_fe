import TagBadge from "@/components/Tags/TagBadge";
import { cn } from "@/lib/utils";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

interface TagBadgesProps extends Omit<
  React.ComponentProps<typeof TagBadge>,
  "tag" | "className"
> {
  tags: TagConfig[] | null;
  className?: string;
  badgeClassName?: string;
}

export function TagBadges({
  tags,
  className,
  size,
  badgeClassName,
  ...badgeProps
}: TagBadgesProps) {
  if (!tags?.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          size={size}
          className={badgeClassName}
          {...badgeProps}
        />
      ))}
    </div>
  );
}
