import { cn } from "@/lib/utils";
import { useShortcutDisplays } from "./keyboardShortcutUtils";

interface KeyboardShortcutBadgeProps {
  shortcut: string | undefined;
  className?: string;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}

/**
 * A reusable component that displays keyboard shortcuts as a small badge.
 * By default, no positioning is applied - use className or position prop for styling.
 */
export function KeyboardShortcutBadge({
  shortcut,
  className,
  position,
}: KeyboardShortcutBadgeProps) {
  if (!shortcut) return null;

  const positionClasses = {
    "top-right": "absolute top-1 right-1",
    "bottom-right": "absolute bottom-1 right-1",
    "top-left": "absolute top-1 left-1",
    "bottom-left": "absolute bottom-1 left-1",
  };

  return (
    <div
      className={cn(
        "h-5 min-w-5 flex items-center justify-center px-1 bg-gradient-to-b from-white to gray-500/20 rounded-md border border-gray-200",
        position ? positionClasses[position] : "",
        className,
      )}
    >
      <span className="font-medium text-xs text-gray-700">{shortcut}</span>
    </div>
  );
}

/**
 * Simple component that takes an actionId and displays the keyboard shortcut badge
 * This is the simplest API - just pass the actionId and it handles everything
 * By default, no positioning is applied - use className or position prop for styling.
 */
export function ShortcutBadge({
  actionId,
  className,
  position,
}: {
  actionId: string;
  className?: string;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}) {
  const getShortcutDisplay = useShortcutDisplays();

  return (
    <KeyboardShortcutBadge
      shortcut={getShortcutDisplay(actionId)}
      className={className}
      position={position}
    />
  );
}
