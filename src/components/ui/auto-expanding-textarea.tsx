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
>(
  (
    { value, onChange, onKeyDown, placeholder, className, ...rest },
    forwardedRef,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (!forwardedRef) return;

      if (typeof forwardedRef === "function") {
        forwardedRef(textareaRef.current);
      } else {
        forwardedRef.current = textareaRef.current;
      }
    }, [forwardedRef]);

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={1}
        style={{ overflow: "hidden", resize: "none" }}
        className={`flex-1 p-2 rounded-md border border-green-700 focus:outline-hidden focus:ring-1 focus:ring-green-700 placeholder:text-gray-500 ${className || ""}`}
        {...rest}
      />
    );
  },
);

AutoExpandingTextarea.displayName = "AutoExpandingTextarea";

export { AutoExpandingTextarea };
export type { AutoExpandingTextareaProps };
