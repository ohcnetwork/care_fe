import CareIcon from "@/CAREUI/icons/CareIcon";
import { cn } from "@/lib/utils";
import React from "react";
import { useTranslation } from "react-i18next";

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
  id?: string;
  colors?: [string, string];
  name: string;
  imageUrl?: string;
  className?: string;
}

interface EditableAvatarProps extends AvatarProps {
  editable?: boolean;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  id,
  colors: propColors,
  name,
  imageUrl,
  className,
}) => {
  const [bgColor] = propColors || toColor(name);
  return (
    <div
      id={id}
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

const EditableAvatar: React.FC<EditableAvatarProps> = ({
  id,
  colors: propColors,
  name,
  imageUrl,
  className,
  editable = true,
  onClick,
}) => {
  const { t } = useTranslation();
  return (
    <div
      id={id}
      className={cn(
        `group grid aspect-square h-full w-full place-items-center text-clip transition-all duration-200 ease-in-out [grid-template-areas:'stack']`,
        editable && "cursor-pointer",
        className,
      )}
    >
      <Avatar
        imageUrl={imageUrl}
        name={name}
        colors={propColors}
        className="flex h-full w-full [grid-area:stack]"
      />

      {editable && (
        <div
          className={
            "flex h-full w-full cursor-pointer flex-col items-center justify-center bg-black text-sm text-secondary-300 opacity-0 transition-opacity [grid-area:stack] hover:opacity-60"
          }
          style={{ borderRadius: "calc(100% / 15)" }}
          onClick={onClick}
        >
          <CareIcon icon="l-pen" className="text-lg" />
          <span className="mt-2">{t(imageUrl ? "edit" : "upload")}</span>
        </div>
      )}
    </div>
  );
};

export { Avatar, EditableAvatar };
