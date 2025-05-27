import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

type ErrorType = "PAGE_NOT_FOUND" | "PAGE_LOAD_ERROR" | "CUSTOM_ERROR";

const snellenLines = [
  "C",
  "O U",
  "L D N",
  "T L O A D",
  "T H E P A G E",
  "R I G H T N O W",
  "R E T U R N T O C A R E",
];

interface ErrorPageProps {
  forError?: ErrorType;
  title?: string;
  message?: string;
  image?: string;
}

export default function ErrorPage({
  forError = "PAGE_NOT_FOUND",
  ...props
}: ErrorPageProps) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const touchTimeoutId = useRef(null);
  const [isUnblurred, setIsUnblurred] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    container?.addEventListener("mousemove", handleMouseMove);

    return () => {
      container?.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleTouchStart = () => {
    setIsTouched(true);
    setIsUnblurred(true);
    if (touchTimeoutId.current) {
      clearTimeout(touchTimeoutId.current);
    }
    setTimeout(() => {
      setIsUnblurred(false);
      setIsTouched(false);
    }, 6000);
  };

  useEffect(() => {
    if (touchTimeoutId.current) {
      clearTimeout(touchTimeoutId.current);
    }
    toast.dismiss();
  }, []);

  const errorContent = {
    PAGE_NOT_FOUND: {
      title: t("page_not_found"),
      message: t("404_message"),
    },
    PAGE_LOAD_ERROR: {
      title: t("page_load_error"),
      message: t("could_not_load_page"),
    },
    CUSTOM_ERROR: {
      title: t("page_load_error"),
      message: t("could_not_load_page"),
    },
  };

  const { title, message } = {
    ...errorContent[forError],
    ...props,
  };

  return (
    <div className="h-[calc(100vh-7rem)] sm:h-[calc(100vh-5rem)] flex flex-col items-center md:justify-center bg-white text-black p-4 rounded-lg overflow-hidden ">
      <div
        className="relative scale-75 md:scale-100 rounded-xl transition border-6 border-yellow-950 duration-300 ease-in-out"
        ref={containerRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          if (!isTouched) setIsUnblurred(false);
          setIsHovering(false);
        }}
        onTouchStart={handleTouchStart}
        style={{
          boxShadow: `
            hsla(57, 19%, 35%, 0.73) 0px 1px 0.8px,
  hsla(57, 19%, 35%, 0.67) 0px 2.3px 1.9px -0.5px,
  hsla(57, 19%, 35%, 0.6) 0px 4.6px 3.8px -1px,
  hsla(57, 19%, 35%, 0.54) 0.1px 9px 7.4px -1.5px,
  hsla(57, 19%, 35%, 0.47) 0.1px 16.8px 13.9px -2px,
  hsla(57, 19%, 35%, 0.41) 0.2px 29.3px 24.2px -2.5px,
  hsla(57, 19%, 35%, 0.34) 0.3px 47.6px 39.3px -3px,
  hsla(57, 19%, 35%, 0.28) 0.5px 73px 60.2px -3.5px,
  hsla(57, 19%, 35%, 0.21) 0.7px 106.8px 88.1px -4px,
  hsla(57, 19%, 35%, 0.15) 0.9px 150px 123.8px -4.5px
          `,
        }}
      >
        <div
          className={cn(
            "absolute inset-0 z-0 rounded-xl bg-yellow-100 blur-3xl pointer-events-none transition-all duration-700 scale-100",
            isHovering ? "opacity-50 scale-100" : "opacity-0 scale-90",
          )}
          aria-hidden="true"
        />

        <div className="relative max-w-fit w-full bg-white rounded-xl ring-1 ring-white/60 backdrop-blur-md transition-all duration-300 hover:shadow-[inset_0_0_40px_rgba(255,255,150,0.5)]">
          {!isTouched && (
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                WebkitMaskImage: `radial-gradient(circle 180px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 70%)`,
                maskImage: `radial-gradient(circle 180px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 70%)`,
                WebkitBackdropFilter: "blur(2px)",
                backdropFilter: "blur(2px)",
              }}
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 flex flex-col items-center px-6 pt-6 pb-8 font-bold text-center leading-none">
            {snellenLines.map((line, index) => {
              const fontSize = 56 - index * 7;
              return (
                <p
                  key={index}
                  className="text-black select-none pb-3 transition-all duration-300"
                  style={{
                    fontSize: `${fontSize}px`,
                    filter: isUnblurred ? "blur(0px)" : "blur(2px)",
                  }}
                  onMouseEnter={() => !isTouched && setIsUnblurred(true)}
                  onMouseLeave={() => !isTouched && setIsUnblurred(false)}
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto text-center px-4">
        <h1 className="md:mt-16 text-xl md:text-4xl text-gray-950 font-bold">
          {title}
        </h1>
        <p className="max-w-sm mx-auto px-2 text-sm md:text-base mt-2 text-gray-600">
          {message}
        </p>
        <div className="mt-6">
          <Button
            onClick={() => {
              goBack("/");
              window.location.reload();
            }}
            className="rounded-md bg-primary-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
          >
            {t("return_to_care")}
          </Button>
        </div>
      </div>
    </div>
  );
}
