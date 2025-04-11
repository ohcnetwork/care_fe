import { t } from "i18next";
import { useEffect, useRef, useState } from "react";

import { Button, ButtonVariant } from "@/components/ui/button";

interface ClampableTextProps {
  text: string;
  linesToClamp?: number;
  className?: string;
  toggleMessageBtnVariant?: ButtonVariant;
  toggleMessageBtnClassName?: string;
}

const ClampableText: React.FC<ClampableTextProps> = ({
  text,
  linesToClamp = 1,
  className = "",
  toggleMessageBtnVariant = "link",
  toggleMessageBtnClassName = "px-0 hover:cursor-pointer text-primary-700",
}) => {
  const [isClamped, setIsClamped] = useState(true);
  const [showToggleButton, setShowToggleButton] = useState(true);
  const [messageExpanded, setMessageExpanded] = useState(false);

  const textContainerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const elem = textContainerRef.current;
    if (!elem) return;
    const observer = new ResizeObserver(() => {
      setShowToggleButton(elem.scrollHeight > elem.clientHeight);
    });
    resizeObserverRef.current = observer;
    observer.observe(elem);
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [text]);

  return (
    <div className={`clampable-text-wrapper ${className}`}>
      <div
        className={isClamped ? `line-clamp-${linesToClamp}` : ""}
        ref={textContainerRef}
      >
        {text}
      </div>
      {(showToggleButton || (!showToggleButton && messageExpanded)) && (
        <Button
          variant={toggleMessageBtnVariant}
          className={toggleMessageBtnClassName}
          onClick={() => {
            setMessageExpanded((prev) => !prev);
            setIsClamped((prev) => !prev);
          }}
        >
          {isClamped ? t("expand_all") : t("hide")}
        </Button>
      )}
    </div>
  );
};
export default ClampableText;
