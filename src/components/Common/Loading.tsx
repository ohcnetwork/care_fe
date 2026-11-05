import { useEffect, useRef, useState } from "react";

import { LoadingAnimationSvg } from "@/components/ui/loading-animation-svg";

const Loading = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetTop, setOffsetTop] = useState(0);

  // Keep the pre-React loading screen up while React is only showing this
  // loader, so the user sees one continuous animation.
  useEffect(() => window.__holdLoadingScreen?.(), []);

  useEffect(() => {
    const calculateOffset = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setOffsetTop(rect.top);
      }
    };

    calculateOffset();

    window.addEventListener("resize", calculateOffset);

    return () => {
      window.removeEventListener("resize", calculateOffset);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex w-full items-center justify-center transition-[height]"
      style={{ height: `calc(100vh - ${offsetTop}px)` }}
    >
      <LoadingAnimationSvg />
    </div>
  );
};

export default Loading;
