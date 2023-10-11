import { useState, useRef, useEffect } from "react";

const useIsScrollable = () => {
  const [isScrollable, setIsScrollable] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const checkScrollable = () => {
    if (ref.current) {
      const { scrollHeight, clientHeight, scrollTop } = ref.current;
      const notScrolledToBottom = scrollTop < scrollHeight - clientHeight;
      setIsScrollable(scrollHeight > clientHeight && notScrolledToBottom);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      checkScrollable();
    };

    const div = ref.current;
    div?.addEventListener("scroll", handleScroll);

    // Check initially
    checkScrollable();

    // Cleanup event listener on component unmount
    return () => {
      div?.removeEventListener("scroll", handleScroll);
    };
  }, [ref.current]); // Re-run effect if divRef.current changes

  return { isScrollable, ref };
};

export default useIsScrollable;
