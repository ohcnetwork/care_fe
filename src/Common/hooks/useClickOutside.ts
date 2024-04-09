import { useEffect, useState, RefObject, useRef } from "react";

function useClickOutside<T extends HTMLElement>(
  initialIsOpen: boolean
): [boolean, React.Dispatch<React.SetStateAction<boolean>>, RefObject<T>] {
  const [isOpen, setIsOpen] = useState<boolean>(initialIsOpen);
  const componentRef = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        componentRef.current &&
        !componentRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return [isOpen, setIsOpen, componentRef];
}

export default useClickOutside;
