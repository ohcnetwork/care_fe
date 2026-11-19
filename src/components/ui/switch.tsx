// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name switch
 * @description A control that allows the user to toggle between checked and not checked.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { CheckIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch hit-area-x-3 hit-area-y-2 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 relative inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-3 aria-invalid:ring-3 data-disabled:cursor-not-allowed data-disabled:opacity-50 h-(--switch-height) w-(--switch-width)",
        size === "sm"
          ? "[--switch-height:--spacing(5)] [--switch-width:36px] md:[--switch-height:--spacing(4.5)] md:[--switch-width:32px]"
          : "[--switch-height:31px] [--switch-width:53px] md:[--switch-height:--spacing(6)] md:[--switch-width:42px]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-background dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground/80 pointer-events-none relative flex items-center justify-center rounded-full shadow-md ring-0 transition-transform group-data-[size=default]/switch:size-[28px] group-data-[size=sm]/switch:size-4.5 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-5px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 md:group-data-[size=default]/switch:size-[22px] md:group-data-[size=sm]/switch:size-4 md:group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-4px)]"
      >
        <CheckIcon className="text-primary-900 dark:text-primary-400 absolute transition-opacity duration-100 group-data-checked/switch:opacity-100 group-data-unchecked/switch:opacity-0 group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-3" />
        <MinusIcon className="text-soft-foreground dark:text-placeholder-foreground absolute transition-opacity duration-100 group-data-checked/switch:opacity-0 group-data-unchecked/switch:opacity-100 group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-3" />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
