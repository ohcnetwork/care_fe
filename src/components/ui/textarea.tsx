import * as React from "react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    isPreview?: boolean;
    onTogglePreview?: (preview: boolean) => void;
  }
>(
  (
    {
      className,
      value = "",
      onChange,
      isPreview = false,
      onTogglePreview,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full">
        {/* Toggle Buttons */}
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            onClick={() => onTogglePreview?.(false)}
            className={`px-3 py-1 rounded-md ${!isPreview ? "bg-primary-500 text-white" : "bg-gray-200"}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onTogglePreview?.(true)}
            className={`px-3 py-1 rounded-md ${isPreview ? "bg-primary-500 text-white" : "bg-gray-200"}`}
          >
            Preview
          </button>
        </div>

        {/* Content Area */}
        {isPreview ? (
          <div className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white p-4 text-base shadow-sm overflow-auto prose">
            <ReactMarkdown>
              {value.trim() ? value : "_No content to preview_"}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            className={cn(
              "flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm transition-colors placeholder:text-gray-500 focus-visible:ring-1 focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-primary-500 md:text-sm disabled:opacity-50",
              className,
            )}
            ref={ref}
            value={value}
            onChange={onChange}
            placeholder="Enter your Markdown content here..."
            {...props}
          />
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
