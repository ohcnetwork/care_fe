import { useShortcutDisplay } from "@/context/ShortcutContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const keyboardShortcutBadgeVariants = cva(
  "h-5 min-w-5 flex justify-center px-1 rounded border font-medium text-xs",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-b from-white to-gray-200 border-gray-200 text-gray-700",
        primary: "border-gray-200/20 font-normal",
        classic_primary:
          "border-primary-900 font-normal bg-linear-to-b from-primary-600 to-primary-900",
        secondary: "bg-gray-50 text-gray-700",
      },
      position: {
        "top-right": "absolute top-1 right-1",
        "bottom-right": "absolute bottom-1 right-1",
        "top-left": "absolute top-1 left-1",
        "bottom-left": "absolute bottom-1 left-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type KeyboardShortcutBadgeVariant = VariantProps<
  typeof keyboardShortcutBadgeVariants
>["variant"];

interface KeyboardShortcutBadgeProps {
  shortcut: string | undefined;
  className?: string;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  alwaysShow?: boolean;
  actionId?: string;
  variant?: KeyboardShortcutBadgeVariant;
}

/**
 * A reusable component that displays keyboard shortcuts as a small badge.
 * By default, no positioning is applied - use className or position prop for styling.
 */
export function KeyboardShortcutBadge({
  shortcut,
  className,
  position,
  alwaysShow = true,
  actionId,
  variant = "default",
}: KeyboardShortcutBadgeProps &
  VariantProps<typeof keyboardShortcutBadgeVariants>) {
  const { isOptionPressed } = useKeyboardShortcuts([], {}, {});

  if (!shortcut || (!alwaysShow && !isOptionPressed)) return null;

  return (
    <div
      data-shortcut-id={actionId}
      className={cn(
        keyboardShortcutBadgeVariants({ variant, position }),
        className,
      )}
    >
      {shortcut}
    </div>
  );
}

/**
 * Simple component that takes an actionId and displays the keyboard shortcut badge
 * This is the simplest API - just pass the actionId and it handles everything
 * By default, no positioning is applied - use className or position prop for styling.
 *
 * This component automatically uses the current shortcut context hierarchy.
 */
export function ShortcutBadge({
  actionId,
  className,
  position,
  alwaysShow = true,
  variant = "default",
}: {
  actionId: string;
  className?: string;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  alwaysShow?: boolean;
  variant?: KeyboardShortcutBadgeVariant;
}) {
  const getShortcutDisplay = useShortcutDisplay();
  const { isOptionPressed } = useKeyboardShortcuts([], {}, {});

  return (
    <KeyboardShortcutBadge
      shortcut={
        alwaysShow || isOptionPressed ? getShortcutDisplay(actionId) : undefined
      }
      className={className}
      position={position}
      alwaysShow={alwaysShow}
      actionId={actionId}
      variant={variant}
    />
  );
}
