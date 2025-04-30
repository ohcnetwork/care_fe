import { useRef } from "react";

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

  return (
    <div
      ref={contentRef}
      className={cn(
        `line-clamp-1`,
        "data-[expanded=true]:line-clamp-none",
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
      className={cn(className)}
      data-slot="expandable-text-expand-button"
      {...props}
    >
      {children}
    </Button>
  );
}

export { ExpandableText, ExpandableTextContent, ExpandableTextExpandButton };
