import { useEffect, useMemo, useState } from "react";

interface Props {
  text: string;
  delay?: number;
}

function getGraphemeClusters(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

export default function FadeInText({ text, delay = 20 }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const characters = useMemo(() => getGraphemeClusters(text), [text]);

  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount((v) => {
        if (v >= characters.length) {
          clearInterval(interval);
          return v;
        }
        return v + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [characters, delay]);

  return (
    <p className="whitespace-pre-wrap">
      {characters.map((char, i) => (
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
