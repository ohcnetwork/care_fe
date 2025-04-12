import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface AutoExpandingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}

function AutoExpandingTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  ...props
}: React.ComponentProps<"textarea"> & AutoExpandingTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const computedStyle = window.getComputedStyle(textareaRef.current);
      const maxHeight = parseInt(computedStyle.getPropertyValue("max-height"));

      if (scrollHeight > maxHeight) {
        textareaRef.current.style.height = `${maxHeight}px`;
        textareaRef.current.style.overflowY = "scroll";
      } else {
        textareaRef.current.style.height = `${scrollHeight}px`;
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      style={{ overflow: "hidden", resize: "none" }}
      className={cn(
        "flex-1 p-2 rounded-md border border-green-700 focus:outline-hidden focus:ring-1 focus:ring-green-700 placeholder:text-gray-500",
        className,
      )}
      {...props}
    />
  );
}

AutoExpandingTextarea.displayName = "AutoExpandingTextarea";

export { AutoExpandingTextarea };
export type { AutoExpandingTextareaProps };
