import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

interface Props {
  /**
   * Strength of the signal, from 0 to 3
   *
   * undefined: Error
   * 0: No signal
   * 1: Weak signal
   * 2: Medium signal
   * 3: Strong signal
   */
  strength?: number;
  children?: React.ReactNode;
}

export default function NetworkSignal({ strength, children }: Props) {
  return (
    <div
      className={classNames(
        "relative flex items-center", // Strength colors
        strength === 0 && "text-danger-500",
        strength === 1 && "text-danger-500",
        strength === 2 && "text-warning-500",
        strength === 3 && "text-primary-500",
      )}
    >
      <div className="flex items-end gap-0.5 p-1.5 md:p-2">
        {strength === undefined ? (
          <CareIcon
            icon="l-exclamation-triangle"
            className="text-lg text-danger-500"
          />
        ) : (
          Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className={classNames(
                "w-1 rounded-sm",

                // Heights
                i === 0 && "h-[5px]",
                i === 1 && "h-[10px]",
                i === 2 && "h-[15px]",

                // Whether to infill with strength color or not
                strength > i ? "bg-current" : "bg-zinc-500/30",
              )}
            />
          ))
        )}
        {!!strength && strength < 2 && (
          <CareIcon
            icon="l-exclamation-circle"
            className="absolute left-0.5 top-0.5 animate-pulse text-xs text-danger-500 md:top-0 md:text-sm"
          />
        )}
      </div>
      {children}
    </div>
  );
}
