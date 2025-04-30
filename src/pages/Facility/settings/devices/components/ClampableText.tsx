import { t } from "i18next";
import { useEffect, useRef, useState } from "react";

import { Button, ButtonVariant } from "@/components/ui/button";

interface ClampableTextProps {
  text: string;
  linesToClamp?: number;
  className?: string;
  toggleTextBtnVariant?: ButtonVariant;
  toggleTextBtnClassName?: string;
}

const ClampableText: React.FC<ClampableTextProps> = ({
  text,
  linesToClamp = 1,
  className = "",
  toggleTextBtnVariant = "link",
  toggleTextBtnClassName = "px-0 hover:cursor-pointer text-primary-600",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const lineVariants: { [key: number]: string } = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
  };

  useEffect(() => {
    if (textRef.current) {
      const isOverflowing =
        textRef.current.scrollHeight > textRef.current.clientHeight;
      setHasOverflow(isOverflowing);
    }
  }, [text, textRef]);

  return (
    <div className={`${className}`}>
      <div
        ref={textRef}
        className={!isExpanded ? lineVariants[linesToClamp] : ""}
      >
        {text}
      </div>
      {(hasOverflow || isExpanded) && (
        <Button
          variant={toggleTextBtnVariant}
          className={toggleTextBtnClassName}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {!isExpanded ? t("expand_all") : t("hide")}
        </Button>
      )}
    </div>
  );
};

export default ClampableText;
