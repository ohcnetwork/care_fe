import { forwardRef, useEffect, useRef } from "react";

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
>(({ value, onChange, onKeyDown, placeholder, ...rest }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      {...rest}
      rows={1}
      style={{ overflow: "hidden", resize: "none" }}
      className="flex-1 p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
});

AutoExpandingTextarea.displayName = "AutoExpandingTextarea";

export { AutoExpandingTextarea };
export type { AutoExpandingTextareaProps };
