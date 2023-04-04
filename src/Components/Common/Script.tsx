import { useEffect } from "react";

export default function Script({
  defer = false,
  src,
  ...props
}: {
  defer?: boolean;
  src: string;
}) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = defer;

    Object.entries(props).forEach(([key, value]) => {
      script.setAttribute(key, value as string);
    });

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [props, defer, src]);

  return null;
}
