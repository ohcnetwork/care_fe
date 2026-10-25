import * as AvatarPrimitive from "@radix-ui/react-avatar";

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
    <AvatarPrimitive.Root className="relative flex size-8 shrink-0 overflow-hidden rounded-full bg-emerald-100 ring-1 ring-emerald-800/15">
      <AvatarPrimitive.Image
        src={imageUrl}
        alt={name}
        className="size-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className="flex size-full items-center justify-center text-xs font-medium text-emerald-800"
        aria-hidden="true"
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
