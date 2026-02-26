import { useEffect, useState } from "react";

interface Props {
  text: string;
  delay?: number;
}

export default function FadeInText({ text, delay = 20 }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount((v) => {
        if (v >= text.length) {
          clearInterval(interval);
          return v;
        }
        return v + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay]);

  return (
    <p className="whitespace-pre-wrap">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-opacity duration-300 ${
            i < visibleCount ? "opacity-100" : "opacity-0"
          }`}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </p>
  );
}
