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
    <AvatarRoot className="relative flex size-8 shrink-0 overflow-hidden rounded-full bg-emerald-100 ring-1 ring-emerald-800/15">
      <AvatarImage
        src={imageUrl}
        alt={name}
        className="size-full object-cover"
      />
      <AvatarFallback
        className="bg-transparent flex size-full items-center justify-center text-xs font-medium text-emerald-800"
        aria-hidden="true"
      >
        {initials}
      </AvatarFallback>
    </AvatarRoot>
  );
}
