import * as AvatarPrimitive from "@radix-ui/react-avatar";
import React from "react";

import { cn } from "@/lib/utils";

// Subtle, professional color combinations that blend well with the UI
const colorPairs: Array<[string, string]> = [
  ["#E3F2FD", "#1565C0"], // Subtle Blue
  ["#E8F5E9", "#2E7D32"], // Subtle Green
  ["#FFF3E0", "#E65100"], // Subtle Orange
  ["#F3E5F5", "#6A1B9A"], // Subtle Purple
  ["#E1F5FE", "#0277BD"], // Subtle Light Blue
  ["#E0F2F1", "#00695C"], // Subtle Teal
  ["#FBE9E7", "#D84315"], // Subtle Deep Orange
  ["#F3E5F5", "#6A1B9A"], // Subtle Purple
  ["#E8EAF6", "#283593"], // Subtle Indigo
  ["#FFF8E1", "#FF8F00"], // Subtle Amber
  ["#FCE4EC", "#C2185B"], // Subtle Pink
  ["#EFEBE9", "#4E342E"], // Subtle Brown
];

const stringToIndex = (name: string): number => {
  return name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

const getColorPair = (name: string): [string, string] => {
  const index = stringToIndex(name) % colorPairs.length;
  return colorPairs[index];
};

const initials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.slice(0, 1))
    .join("")
    .toUpperCase();
};

interface AvatarProps {
  colors?: [string, string];
  name: string;
  imageUrl?: string;
  className?: string;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ colors: propColors, name, imageUrl, className }, ref) => {
  const avatarText = name.match(/[a-zA-Z]+/g)?.join(" ");

  const [bgColor, textColor] =
    propColors ||
    (avatarText ? getColorPair(avatarText) : getColorPair("user"));

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn("w-full h-full rounded-md", className)}
      style={{
        background: bgColor,
      }}
    >
      <AvatarPrimitive.Image
        src={imageUrl}
        alt={name}
        className={cn(
          "aspect-square h-full w-full object-cover rounded-md",
          className,
        )}
      />
      <AvatarPrimitive.Fallback className="flex h-full w-full select-none items-center justify-center text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 100 100"
          className="aspect-square h-full w-full object-cover"
        >
          <text
            fill={textColor}
            fillOpacity="0.5"
            fontSize="50"
            fontWeight="900"
            x="50"
            y="54"
            textAnchor="middle"
            dominantBaseline="middle"
            alignmentBaseline="middle"
          >
            {avatarText ? initials(avatarText) : null}
          </text>
        </svg>
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
});

Avatar.displayName = "Avatar";

export { Avatar };
export type { AvatarProps };
