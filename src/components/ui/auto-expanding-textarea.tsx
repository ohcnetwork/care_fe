import { forwardRef, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { Textarea } from "./textarea";

interface AutoExpandingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}

const AutoExpandingTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextareaProps
>(({ value, onChange, onKeyDown, placeholder, className, ...rest }, _ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      {...rest}
      className={cn("min-h-[40px] max-h-[200px] resize-none", className)}
    />
  );
});

AutoExpandingTextarea.displayName = "AutoExpandingTextarea";

export { AutoExpandingTextarea };
export type { AutoExpandingTextareaProps };
