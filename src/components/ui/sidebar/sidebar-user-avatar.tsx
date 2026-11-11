import {
  AvatarFallback,
  AvatarImage,
  Avatar as AvatarRoot,
} from "@/components/ui/avatar";

interface SidebarUserAvatarProps {
  name: string;
  imageUrl?: string;
}

export function SidebarUserAvatar({ name, imageUrl }: SidebarUserAvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <AvatarRoot
      shape="rounded"
      className="size-8 overflow-hidden rounded-lg after:rounded-lg"
    >
      <AvatarImage src={imageUrl} alt={name} className="rounded-lg" />
      <AvatarFallback
        className="rounded-lg bg-green-100 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200"
        aria-hidden="true"
      >
        {initials}
      </AvatarFallback>
    </AvatarRoot>
  );
}
