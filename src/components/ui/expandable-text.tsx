import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

function ExpandableText({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center", className)}
      data-slot="expandable-text-root"
      {...props}
    >
      {children}
    </div>
  );
}

function ExpandableTextContent({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const checkOverflow = () => {
      // Temporarily remove line-clamp to check actual content height
      const existing = content.style.getPropertyValue("-webkit-line-clamp");
      content.style.setProperty("-webkit-line-clamp", "unset");
      content.style.setProperty("height", "calc(var(--spacing) * 6)");

      const hasOverflow = content.scrollHeight > content.offsetHeight;

      // Reset the line-clamp and height
      content.style.setProperty("-webkit-line-clamp", existing);
      content.style.setProperty("height", "auto");

      content.dataset.overflow = hasOverflow ? "true" : "false";
    };

    checkOverflow();

    // Check on resize
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={contentRef}
      className={cn(
        "peer line-clamp-1 data-[expanded=true]:line-clamp-none",
        className,
      )}
      data-slot="expandable-text-content"
      {...props}
    >
      {children}
    </div>
  );
}

function ExpandableTextExpandButton({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    const contentElement = buttonRef.current
      ?.closest("[data-slot='expandable-text-root']")
      ?.querySelector("[data-slot='expandable-text-content']");
    if (contentElement) {
      contentElement.setAttribute("data-expanded", "true");
      buttonRef.current?.remove();
    }
  };

  return (
    <Button
      ref={buttonRef}
      variant="secondary"
      size="xs"
      onClick={handleClick}
      className={cn("hidden peer-data-[overflow=true]:inline-flex", className)}
      data-slot="expandable-text-expand-button"
      {...props}
    >
      {children}
    </Button>
  );
}

export { ExpandableText, ExpandableTextContent, ExpandableTextExpandButton };
