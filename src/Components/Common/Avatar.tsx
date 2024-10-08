import React from "react";

const colors: [string, boolean][] = [
  ["#ff4040", false],
  ["#7f2020", false],
  ["#cc5c33", false],
  ["#734939", false],
  ["#bf9c8f", false],
  ["#995200", false],
  ["#4c2900", false],
  ["#f2a200", false],
  ["#ffd580", true],
  ["#332b1a", false],
  ["#4c3d00", false],
  ["#ffee00", true],
  ["#b0b386", false],
  ["#64664d", false],
  ["#6c8020", false],
  ["#c3d96c", true],
  ["#143300", false],
  ["#19bf00", false],
  ["#53a669", false],
  ["#bfffd9", true],
  ["#40ffbf", true],
  ["#1a332e", false],
  ["#00b3a7", false],
  ["#165955", false],
  ["#00b8e6", false],
  ["#69818c", false],
  ["#005ce6", false],
  ["#6086bf", false],
  ["#000e66", false],
  ["#202440", false],
  ["#393973", false],
  ["#4700b3", false],
  ["#2b0d33", false],
  ["#aa86b3", false],
  ["#ee00ff", false],
  ["#bf60b9", false],
  ["#4d3949", false],
  ["#ff00aa", false],
  ["#7f0044", false],
  ["#f20061", false],
  ["#330007", false],
  ["#d96c7b", false],
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
  const index = stringToInt(name) % 42;
  const [backgroundColor, blackText] = colors[index];
  return [backgroundColor, blackText ? "#000000" : "#FFFFFF"];
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
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  colors: propColors,
  name,
  className,
}) => {
  const [bgColor, fgColor] = propColors || toColor(name);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 100 100"
      className={className}
    >
      <circle cx="50" cy="50" r="50" fill={bgColor} />
      <text
        fill={fgColor}
        fontSize="42"
        fontFamily="sans-serif"
        x="50"
        y="54"
        textAnchor="middle"
        dominantBaseline="middle"
        alignmentBaseline="middle"
      >
        {initials(name)}
      </text>
    </svg>
  );
};

export { Avatar };
