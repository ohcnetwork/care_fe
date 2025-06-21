import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 focus-visible:border-gray-950 focus-visible:ring-gray-950/50 dark:data-[state=unchecked]:bg-gray-200/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-gray-200 border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:data-[state=checked]:bg-gray-50 dark:data-[state=unchecked]:bg-gray-800 dark:focus-visible:border-gray-300 dark:focus-visible:ring-gray-300/50 dark:dark:data-[state=unchecked]:bg-gray-800/80 dark:border-gray-800",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-white dark:data-[state=unchecked]:bg-gray-950 dark:data-[state=checked]:bg-gray-50 pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:bg-gray-950 dark:dark:data-[state=unchecked]:bg-gray-50 dark:dark:data-[state=checked]:bg-gray-900",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
