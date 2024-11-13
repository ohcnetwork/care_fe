import { useEffect, useRef, useState } from "react";

const Loading = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    const calculateOffset = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setOffsetTop(rect.top);
      }
    };

    calculateOffset();

    window.addEventListener("resize", calculateOffset);
    window.addEventListener("scroll", calculateOffset, true);

    return () => {
      window.removeEventListener("resize", calculateOffset);
      window.removeEventListener("scroll", calculateOffset, true);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex w-full items-center justify-center transition-[height]"
      style={{ height: `calc(100vh - ${offsetTop}px)` }}
    >
      <img
        src="/images/care_logo_gray.svg"
        className="App-logo"
        alt="loading"
      />
    </div>
  );
};

export default Loading;
