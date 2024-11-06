import { useEffect, useRef } from "react";

import useAuthUser from "@/hooks/useAuthUser";

export default function FeedWatermark() {
  const me = useAuthUser();
  return (
    <>
      <Watermark className="left-1/3 top-1/3 -translate-x-1/2 -translate-y-1/2">
        {me.username}
      </Watermark>
      {/* <Watermark className="right-1/3 top-1/3 -translate-y-1/2 translate-x-1/2">
        {me.username}
      </Watermark>
      <Watermark className="bottom-1/3 left-1/3 -translate-x-1/2 translate-y-1/2">
        {me.username}
      </Watermark> */}
      <Watermark className="bottom-1/3 right-1/3 translate-x-1/2 translate-y-1/2">
        {me.username}
      </Watermark>
    </>
  );
}

const Watermark = (props: { children: string; className: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const parentRef = useRef<HTMLElement | null>(null);

  // This adds the element back if the element was removed from the DOM
  useEffect(() => {
    parentRef.current = ref.current?.parentElement || null;
    let animationFrameId: number;

    const checkWatermark = () => {
      const watermark = ref.current;
      const parent = parentRef.current;
      if (watermark && parent && !parent.contains(watermark)) {
        parent.appendChild(watermark);
      }
      animationFrameId = requestAnimationFrame(checkWatermark);
    };

    animationFrameId = requestAnimationFrame(checkWatermark);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <span
      ref={ref}
      className={`absolute z-10 text-sm font-bold text-white/20 md:text-2xl ${props.className}`}
    >
      {props.children}
    </span>
  );
};
