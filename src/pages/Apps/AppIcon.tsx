import { LayoutGrid } from "lucide-react";
import { useState } from "react";

interface AppIconProps {
  src?: string;
  alt?: string;
}

export function AppIcon({ src, alt = "" }: AppIconProps) {
  const [erroredSrc, setErroredSrc] = useState<string>();
  const hasError = !src || src === erroredSrc;

  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-primary shadow-sm">
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-contain p-2"
          onError={() => setErroredSrc(src)}
        />
      ) : (
        <LayoutGrid className="size-6 text-muted-foreground" />
      )}
    </div>
  );
}
