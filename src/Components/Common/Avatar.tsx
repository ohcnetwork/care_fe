import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

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
  if (!name) {
    return ""; // Return empty string or a default value if the name is undefined or null
  }
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
  const [width, setWidth] = useState(0);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      const avatarRect = avatarRef.current?.getBoundingClientRect();
      const width = avatarRect?.width || 0;
      setWidth(width);
    };
    updateWidth();
    document.addEventListener("resize", updateWidth);
    return () => document.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div
      ref={avatarRef}
      className={cn(
        `flex aspect-square w-full items-center justify-center overflow-hidden border border-black/10 font-black text-black/10`,
        className,
      )}
      style={{
        background: bgColor,
        borderRadius: width / 15 + "px",
        fontSize: width / 2.5 + "px",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div>{initials(name)}</div>
      )}
    </div>
  );
};

export { Avatar };
