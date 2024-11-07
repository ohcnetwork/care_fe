import React from "react";

import { cn } from "@/lib/utils";

const colors: string[] = [
  "#E6F3FF", // Light Blue
  "#FFF0E6", // Light Peach
  "#E6FFE6", // Light Green
  "#FFE6E6", // Light Pink
  "#F0E6FF", // Light Purple
  "#FFFFE6", // Light Yellow
  "#E6FFFF", // Light Cyan
  "#FFE6F3", // Light Rose
  "#F3FFE6", // Light Lime
  "#E6E6FF", // Light Lavender
  "#FFE6FF", // Light Magenta
  "#E6FFF0", // Light Mint
];

const stringToInt = (name: string): number => {
  const aux = (sum: number, remains: string): number => {
    if (remains === "") return sum;
    const firstCharacter = remains.slice(0, 1);
    const newRemains = remains.slice(1);
    return aux(sum + firstCharacter.charCodeAt(0), newRemains);
  };

  return Math.floor(aux(0, name));
};

const toColor = (name: string): [string, string] => {
  const index = stringToInt(name) % colors.length;
  const backgroundColor = colors[index];
  return [backgroundColor, "#333333"]; // Using dark gray for text
};

const initials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.slice(0, 1))
    .join("")
    .toUpperCase(); // Ensure initials are uppercase
};

interface AvatarProps {
  colors?: [string, string];
  name: string;
  imageUrl?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  colors: propColors,
  name,
  imageUrl,
  className,
}) => {
  const [bgColor] = propColors || toColor(name);
  return (
    <div
      className={cn(
        `flex aspect-square w-full items-center justify-center overflow-hidden border border-black/10`,
        className,
      )}
      style={{
        background: bgColor,
        borderRadius: "calc(100% / 15)",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 100 100"
          className="aspect-square h-full w-full object-cover"
        >
          <text
            fill="black"
            fillOpacity="0.1"
            fontSize="40"
            fontWeight="900"
            x="50"
            y="54"
            textAnchor="middle"
            dominantBaseline="middle"
            alignmentBaseline="middle"
          >
            {initials(name)}
          </text>
        </svg>
      )}
    </div>
  );
};

export { Avatar };
export type { AvatarProps };
