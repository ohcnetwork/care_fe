import { useEffect } from "react";

interface Props {
  id?: string;
  defer?: boolean;
  src: string;
  [key: string]: any;
}

/**
 * Dynamically load a script into the page.
 * To refresh the script, change the `key` prop.
 */
export default function Script({ id, defer = false, src, ...attrs }: Props) {
  useEffect(() => {
    const script = document.createElement("script");

    if (id) script.id = id;
    script.src = src;
    script.async = true;
    script.defer = defer;

    Object.entries(attrs).forEach((e) => script.setAttribute(...e));

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [id, defer, src]);

  return null;
}
