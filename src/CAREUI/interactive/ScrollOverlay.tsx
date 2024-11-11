import useVisibility from "@/hooks/useVisibility";

import { classNames } from "@/Utils/utils";

interface Props {
  className?: string;
  children: React.ReactNode;
  overlay: React.ReactNode;
  disableOverlay?: boolean;
}

export default function ScrollOverlay(props: Props) {
  const [bottomIsVisible, ref] = useVisibility();
  const hasScrollContent = !props.disableOverlay && !bottomIsVisible;

  return (
    <div className={classNames("relative", props.className)}>
      {props.children}

      <div ref={ref as any} />
      <div
        className={classNames(
          "sticky inset-x-0 -bottom-3.5 z-10 flex items-end justify-center bg-gradient-to-t from-secondary-900/90 to-transparent text-white transition-all duration-500 ease-in-out md:bottom-0",
          hasScrollContent ? "h-16 opacity-75" : "h-0 opacity-0",
        )}
      >
        {hasScrollContent && props.overlay}
      </div>
    </div>
  );
}
